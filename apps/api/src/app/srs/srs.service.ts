import { Injectable } from "@nestjs/common";
import { Card as PrismaCard, CardSrsState as PrismaCardSrsState, Prisma } from "@scholarsome/prisma";
import {
  SrsCardState,
  SrsQueueData,
  SrsRating,
  SrsReviewData,
  SrsState,
  SrsUpcomingBuckets
} from "@scholarsome/shared";
import { createEmptyCard, fsrs, generatorParameters, State, type Card, type FSRSParameters, type Grade, type RecordLogItem, type Steps } from "ts-fsrs";
import { PrismaService } from "../providers/database/prisma/prisma.service";

@Injectable()
export class SrsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * Time by which the due cutoff of the review queue is extended. Cards that are
   * not due yet but due within this window are part of the queue as well, so that
   * a session starting slightly earlier than the last one does not skip cards
   * scheduled for exactly the time between two sessions — a card graduating with
   * a 24h interval would otherwise only reappear after 48h whenever a session
   * starts earlier than the day before. Rating such cards early is scheduled
   * correctly by ts-fsrs, as retrievability is always computed from the elapsed time.
   *
   * The window is deliberately the same for every review cadence: it compensates for
   * the drift of session start times, which does not grow with the time between two
   * sessions. For sparse cadences (every two days and sparser) nothing can be due
   * within hours of a session, as their shortest schedule of 1d is always due before
   * the next session, so a larger window would only pull stability-scheduled cards
   * into reviews days too early. For dense cadences the short steps (3h/6h) are due
   * again before the next session ends, so cards can slip at most a single session
   */
  private readonly queueLookaheadMs = 4 * 3600000;

  /**
   * Collects the IDs of a folder and recursively all of its subfolders
   *
   * @param userId ID of the user the folders have to belong to
   * @param folderId ID of the folder to start the traversal at
   *
   * @returns Array of folder IDs, or null if the folder does not exist or does not belong to the user
   */
  private async collectFolderTreeIds(userId: string, folderId: string): Promise<string[] | null> {
    const folders = await this.prisma.folder.findMany({
      where: {
        authorId: userId
      },
      select: {
        id: true,
        parentFolderId: true
      }
    });

    if (!folders.some((f) => f.id === folderId)) return null;

    // map of parent folder IDs to their subfolder IDs
    const subfolderMap = new Map<string, string[]>();
    for (const folder of folders) {
      if (!folder.parentFolderId) continue;
      subfolderMap.set(folder.parentFolderId, [...subfolderMap.get(folder.parentFolderId) ?? [], folder.id]);
    }

    // depth-first traversal with a cycle guard, as parent/subfolder
    // relations are not strictly prevented from forming cycles
    const folderIds: string[] = [];
    const stack = [folderId];

    while (stack.length > 0) {
      const currentId = stack.pop() as string;
      if (folderIds.includes(currentId)) continue;

      folderIds.push(currentId);
      stack.push(...subfolderMap.get(currentId) ?? []);
    }

    return folderIds;
  }

  /**
   * Queries all sets that are connected to any of the given folders
   *
   * @param folderIds IDs of the folders to query the sets of
   *
   * @returns Array of `Set` objects including their cards
   */
  private async setsOfFolders(folderIds: string[]): Promise<Prisma.SetGetPayload<{ include: { cards: true } }>[]> {
    return this.prisma.set.findMany({
      where: {
        folders: {
          some: {
            id: { in: folderIds }
          }
        }
      },
      include: {
        cards: true
      }
    });
  }

  /**
   * Queries all sets of a user
   *
   * @param userId ID of the user to query the sets of
   *
   * @returns Array of `Set` objects including their cards
   */
  private async setsOfUser(userId: string): Promise<Prisma.SetGetPayload<{ include: { cards: true } }>[]> {
    return this.prisma.set.findMany({
      where: {
        authorId: userId
      },
      include: {
        cards: true
      }
    });
  }

  /**
   * Converts the stored JSON columns of the user into arrays.
   * Falls back to null on invalid values, in which case the ts-fsrs defaults are used.
   *
   * @param value Value of a Prisma `Json` column
   *
   * @returns Parsed array or null
   */
  private parseJsonArray(value: Prisma.JsonValue | null): unknown[] | null {
    if (value === null || value === undefined) return null;

    let parsed: unknown = value;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return null;
      }
    }

    return Array.isArray(parsed) ? parsed : null;
  }

  /**
   * Default SRS steps for cases where the values stored on the user are invalid
   */
  private readonly defaultLearningSteps: Steps = ["6h", "1d"];
  private readonly defaultRelearningSteps: Steps = ["4h"];

  /**
   * Builds the ts-fsrs parameters of a user from the columns stored on the user
   *
   * @param user User object containing the SRS parameter columns
   *
   * @returns Complete `FSRSParameters` object, with defaults filled in for invalid values
   */
  private buildParameters(user: {
    srsRequestRetention: number | null,
    srsMaximumInterval: number | null,
    srsW: Prisma.JsonValue | null,
    srsEnableFuzz: boolean | null,
    srsEnableShortTerm: boolean | null,
    srsLearningSteps: Prisma.JsonValue | null,
    srsRelearningSteps: Prisma.JsonValue | null
  }): FSRSParameters {
    const parsedW = this.parseJsonArray(user.srsW);
    const parsedLearningSteps = this.parseJsonArray(user.srsLearningSteps);
    const parsedRelearningSteps = this.parseJsonArray(user.srsRelearningSteps);

    const isStep = (value: unknown): value is string => typeof value === "string" && /^\d+(?:m|h|d)$/.test(value);

    return generatorParameters({
      request_retention: user.srsRequestRetention ?? undefined,
      maximum_interval: user.srsMaximumInterval ?? undefined,
      // an empty or invalid w array falls back to the ts-fsrs defaults
      w: parsedW !== null && parsedW.length > 0 && parsedW.every((n) => typeof n === "number") ? parsedW as number[] : undefined,
      enable_fuzz: user.srsEnableFuzz ?? undefined,
      enable_short_term: user.srsEnableShortTerm ?? undefined,
      learning_steps: parsedLearningSteps !== null && parsedLearningSteps.every(isStep) ? parsedLearningSteps as Steps : this.defaultLearningSteps,
      relearning_steps: parsedRelearningSteps !== null && parsedRelearningSteps.every(isStep) ? parsedRelearningSteps as Steps : this.defaultRelearningSteps
    });
  }

  /**
   * Converts a persisted `CardSrsState` row into a ts-fsrs `Card`
   *
   * @param state `CardSrsState` row of the user and card
   *
   * @returns ts-fsrs `Card` object
   */
  private rowToFsrsCard(state: PrismaCardSrsState): Card {
    return {
      due: state.due,
      stability: state.stability,
      difficulty: state.difficulty,
      elapsed_days: state.elapsedDays,
      scheduled_days: state.scheduledDays,
      learning_steps: state.learningSteps,
      reps: state.reps,
      lapses: state.lapses,
      // the numeric values of `SrsState` map 1:1 to the ts-fsrs `State` enum
      state: state.state as number as State,
      last_review: state.lastReview ?? undefined
    };
  }

  /**
   * Converts a ts-fsrs `Card` into the data of a `CardSrsState` row,
   * without the user and card references
   *
   * @param card ts-fsrs `Card` object
   *
   * @returns Data object for creating or updating a `CardSrsState` row
   */
  private fsrsCardToStateData(card: Card): {
    due: Date,
    stability: number,
    difficulty: number,
    elapsedDays: number,
    scheduledDays: number,
    learningSteps: number,
    reps: number,
    lapses: number,
    state: number,
    lastReview: Date | null
  } {
    return {
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsed_days,
      scheduledDays: card.scheduled_days,
      learningSteps: card.learning_steps,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state as number,
      lastReview: card.last_review ?? null
    };
  }

  /**
   * Converts a ts-fsrs `Card` into its serializable representation
   *
   * @param card ts-fsrs `Card` object
   *
   * @returns `SrsCardState` object
   */
  private toSrsCardState(card: Card): SrsCardState {
    return {
      due: new Date(card.due).toISOString(),
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      learning_steps: card.learning_steps,
      reps: card.reps,
      lapses: card.lapses,
      // the numeric values of the ts-fsrs `State` enum map 1:1 to `SrsState`
      state: card.state as number as SrsState,
      last_review: card.last_review ? new Date(card.last_review).toISOString() : null
    };
  }

  /**
   * Converts a `SrsRating` into a ts-fsrs `Grade`, whose numeric
   * values map 1:1 to the `SrsRating` enum
   *
   * @param rating `SrsRating` to convert
   *
   * @returns ts-fsrs `Grade`
   */
  private toGrade(rating: SrsRating): Grade {
    return rating as number as Grade;
  }

  /**
   * Builds the review queue for a user.
   * When a set is given, it contains every card scheduled for review within
   * the set.
   * Otherwise, when a folder is given, it contains every card scheduled for
   * review within the folder and recursively within all of its subfolders.
   * When no set and no folder is given, it contains every card scheduled for
   * review across all sets of the user.
   * Cards are ordered new cards first. Additionally returns the upcoming
   * review buckets of the cards that are not due yet.
   *
   * @param userId ID of the user to build the queue for
   * @param folderId Optional, ID of the folder to build the queue of
   * @param setId Optional, ID of the set to build the queue of
   *
   * @returns `SrsQueueData` object, or null if the folder or set does not exist or does not belong to the user
   */
  async getQueue(userId: string, folderId?: string, setId?: string): Promise<SrsQueueData | null> {
    const now = new Date();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    if (!user) return null;

    let sets: Prisma.SetGetPayload<{ include: { cards: true } }>[];

    if (setId) {
      // within a set, only the set itself is considered, and only if it belongs to the user
      const set = await this.prisma.set.findUnique({
        where: { id: setId },
        include: { cards: true }
      });
      if (!set || set.authorId !== userId) return null;

      sets = [set];
    } else if (folderId) {
      const folderIds = await this.collectFolderTreeIds(userId, folderId);
      if (!folderIds) return null;

      // within a folder, only the sets connected to the folder tree are considered
      sets = await this.setsOfFolders(folderIds);
    } else {
      // without a folder, the queue spans every set of the user
      sets = await this.setsOfUser(userId);
    }

    // a set can be connected to multiple folders of the tree, so cards have to be deduplicated
    const uniqueCards: PrismaCard[] = [];
    const seenCards = new Set<string>();
    for (const set of sets) {
      for (const card of set.cards) {
        if (seenCards.has(card.id)) continue;

        seenCards.add(card.id);
        uniqueCards.push(card);
      }
    }

    // batch load the persisted SRS states of the user for all cards
    const srsStates = await this.prisma.cardSrsState.findMany({
      where: {
        userId,
        cardId: {
          in: uniqueCards.map((card) => card.id)
        }
      }
    });
    const srsStateMap = new Map<string, PrismaCardSrsState>(srsStates.map((state) => [state.cardId, state]));

    const cardMap = new Map<string, { card: PrismaCard, srs: SrsCardState, due: Date }>();
    for (const card of uniqueCards) {
      // cards without a persisted state are treated as new cards
      const state = srsStateMap.get(card.id);
      const fsrsCard = state ? this.rowToFsrsCard(state) : createEmptyCard(now);

      cardMap.set(card.id, {
        card,
        srs: this.toSrsCardState(fsrsCard),
        due: fsrsCard.due
      });
    }

    const allCards = [...cardMap.values()];

    // only cards that are scheduled for review are part of the queue, plus
    // cards that fall into the lookahead window (see queueLookaheadMs)
    const dueCards = allCards.filter((c) => c.due.getTime() <= now.getTime());
    const notDueCards = allCards.filter((c) => c.due.getTime() > now.getTime());
    const upcomingCards = notDueCards.filter((c) => c.due.getTime() <= now.getTime() + this.queueLookaheadMs);

    // new cards first, then ordered by their due date
    const queueCards = [...dueCards, ...upcomingCards];
    queueCards.sort((a, b) => {
      if (a.srs.state !== b.srs.state) return a.srs.state - b.srs.state;
      if (a.due.getTime() !== b.due.getTime()) return a.due.getTime() - b.due.getTime();
      return a.card.index - b.card.index;
    });

    const hourInMs = 3600000;
    const dayInMs = 24 * hourInMs;

    // amount of not yet due cards, bucketed by how far their due date is in the future
    const upcomingBuckets: SrsUpcomingBuckets = {
      upcomingWithin4Hours: notDueCards.filter((c) => c.due.getTime() - now.getTime() <= 4 * hourInMs).length,
      upcomingWithin24Hours: notDueCards.filter((c) => c.due.getTime() - now.getTime() > 4 * hourInMs && c.due.getTime() - now.getTime() <= dayInMs).length,
      upcomingWithin3Days: notDueCards.filter((c) => c.due.getTime() - now.getTime() > dayInMs && c.due.getTime() - now.getTime() <= 3 * dayInMs).length,
      upcomingWithin7Days: notDueCards.filter((c) => c.due.getTime() - now.getTime() > 3 * dayInMs && c.due.getTime() - now.getTime() <= 7 * dayInMs).length
    };

    return {
      cards: queueCards.map((c) => {
        return {
          card: c.card,
          srs: c.srs
        };
      }),
      upcomingBuckets
    };
  }

  /**
   * Applies a rating to a card within the SRS
   *
   * @param userId ID of the user reviewing the card
   * @param cardId ID of the card to rate
   * @param rating Rating to apply to the card
   *
   * @returns `SrsReviewData` object, or null if the card does not exist or does not belong to the user
   */
  async rate(userId: string, cardId: string, rating: SrsRating): Promise<SrsReviewData | null> {
    const now = new Date();

    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        set: {
          select: { authorId: true }
        }
      }
    });
    if (!card || card.set.authorId !== userId) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        srsRequestRetention: true,
        srsMaximumInterval: true,
        srsW: true,
        srsEnableFuzz: true,
        srsEnableShortTerm: true,
        srsLearningSteps: true,
        srsRelearningSteps: true
      }
    });
    if (!user) return null;

    const parameters = this.buildParameters(user);
    const scheduler = fsrs(parameters);

    const stateRow = await this.prisma.cardSrsState.findUnique({
      where: {
        userId_cardId: {
          userId,
          cardId
        }
      }
    });
    const currentCard = stateRow ? this.rowToFsrsCard(stateRow) : createEmptyCard(now);

    const result: RecordLogItem = scheduler.next(currentCard, now, this.toGrade(rating));

    const srsState = this.toSrsCardState(result.card);

    // persist the new card state and store the review log within a transaction,
    // so that the history always matches the stored state
    await this.prisma.$transaction([
      this.prisma.cardSrsState.upsert({
        where: {
          userId_cardId: {
            userId,
            cardId
          }
        },
        create: {
          userId,
          cardId,
          ...this.fsrsCardToStateData(result.card)
        },
        update: this.fsrsCardToStateData(result.card)
      }),
      this.prisma.cardSrsReviewLog.create({
        data: {
          userId,
          cardId,
          setId: card.setId,
          rating,
          state: result.log.state as number,
          due: result.log.due,
          stability: result.log.stability,
          difficulty: result.log.difficulty,
          elapsedDays: result.log.elapsed_days,
          lastElapsedDays: result.log.last_elapsed_days,
          scheduledDays: result.log.scheduled_days,
          learningSteps: result.log.learning_steps,
          review: result.log.review
        }
      })
    ]);

    return {
      cardId: card.id,
      rating,
      srs: srsState
    };
  }
}
