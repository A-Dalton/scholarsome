import { Injectable } from "@nestjs/common";
import { CardSrsState as PrismaCardSrsState, Prisma } from "@scholarsome/prisma";
import {
  SrsCard,
  SrsCardState,
  SrsParameters,
  SrsQueueStats,
  SrsRating,
  SrsReviewData,
  SrsReviewLog,
  SrsReviewStats,
  SrsState
} from "@scholarsome/shared";
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type FSRSParameters, type Grade, type RecordLogItem, type ReviewLog, type Steps } from "ts-fsrs";
import { PrismaService } from "../providers/database/prisma/prisma.service";

@Injectable()
export class SrsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * Maximum amount of cards included in the scheduling preview of the queue statistics
   */
  private readonly previewCardLimit = 10;

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
   * Converts a `SrsCardState` into a ts-fsrs `Card`
   *
   * @param state `SrsCardState` object
   *
   * @returns ts-fsrs `Card` object
   */
  private toFsrsCard(state: SrsCardState): Card {
    return {
      due: new Date(state.due),
      stability: state.stability,
      difficulty: state.difficulty,
      elapsed_days: state.elapsed_days,
      scheduled_days: state.scheduled_days,
      learning_steps: state.learning_steps,
      reps: state.reps,
      lapses: state.lapses,
      // the numeric values of `SrsState` map 1:1 to the ts-fsrs `State` enum
      state: state.state as number as State,
      last_review: state.last_review ? new Date(state.last_review) : undefined
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
   * Converts a ts-fsrs `ReviewLog` into its serializable representation
   *
   * @param rating Rating that was applied
   * @param log ts-fsrs `ReviewLog` object
   *
   * @returns `SrsReviewLog` object
   */
  private toSrsReviewLog(rating: SrsRating, log: ReviewLog): SrsReviewLog {
    return {
      rating,
      state: log.state as number as SrsState,
      due: new Date(log.due).toISOString(),
      review: new Date(log.review).toISOString(),
      stability: log.stability,
      difficulty: log.difficulty,
      elapsed_days: log.elapsed_days,
      last_elapsed_days: log.last_elapsed_days,
      scheduled_days: log.scheduled_days,
      learning_steps: log.learning_steps
    };
  }

  /**
   * Converts `FSRSParameters` into its serializable representation
   *
   * @param parameters `FSRSParameters` object
   *
   * @returns `SrsParameters` object
   */
  private toSrsParameters(parameters: FSRSParameters): SrsParameters {
    return {
      request_retention: parameters.request_retention,
      maximum_interval: parameters.maximum_interval,
      w: [...parameters.w],
      enable_fuzz: parameters.enable_fuzz,
      enable_short_term: parameters.enable_short_term,
      learning_steps: [...parameters.learning_steps],
      relearning_steps: [...parameters.relearning_steps]
    };
  }

  /**
   * Builds the review history statistics of the given cards for a user,
   * based on the persisted review logs
   *
   * @param userId ID of the user the logs have to belong to
   * @param cardIds IDs of the cards within the scope
   *
   * @returns Review history statistics of the scope
   */
  private async reviewStats(userId: string, cardIds: string[]): Promise<SrsQueueStats["reviews"]> {
    if (cardIds.length === 0) {
      return {
        total: 0,
        ratingCounts: { [SrsRating.Again]: 0, [SrsRating.Hard]: 0, [SrsRating.Good]: 0 },
        lastReview: null
      };
    }

    const [ratingCounts, lastReviewLog] = await Promise.all([
      this.prisma.cardSrsReviewLog.groupBy({
        by: ["rating"],
        where: {
          userId,
          cardId: {
            in: cardIds
          }
        },
        _count: {
          _all: true
        }
      }),
      this.prisma.cardSrsReviewLog.findFirst({
        where: {
          userId,
          cardId: {
            in: cardIds
          }
        },
        orderBy: {
          review: "desc"
        },
        select: {
          review: true
        }
      })
    ]);

    return {
      total: ratingCounts.reduce((sum, count) => sum + count._count._all, 0),
      ratingCounts: {
        [SrsRating.Again]: ratingCounts.find((count) => count.rating === SrsRating.Again)?._count._all ?? 0,
        [SrsRating.Hard]: ratingCounts.find((count) => count.rating === SrsRating.Hard)?._count._all ?? 0,
        [SrsRating.Good]: ratingCounts.find((count) => count.rating === SrsRating.Good)?._count._all ?? 0
      },
      lastReview: lastReviewLog?.review.toISOString() ?? null
    };
  }

  /**
   * Builds the review queue for a user.
   * When a folder is given, it contains every card scheduled for review within
   * the folder and recursively within all of its subfolders.
   * When no folder is given, it contains every card scheduled for review
   * across all sets of the user.
   * Cards are ordered new cards first.
   * Also returns statistics regarding the SRS for debug purposes, which are
   * always scoped to a folder and its subfolders or to all sets.
   *
   * @param userId ID of the user to build the queue for
   * @param folderId Optional, ID of the folder to build the queue of
   *
   * @returns `SrsQueueData` object, or null if the folder does not exist or does not belong to the user
   */
  async getQueue(userId: string, folderId?: string): Promise<{ cards: SrsCard[], stats: SrsQueueStats } | null> {
    const scope = folderId ? "folder" : "all";
    const now = new Date();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
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

    let sets: Prisma.SetGetPayload<{ include: { cards: true } }>[];
    let folderCount: number;
    let folderName: string;

    if (folderId) {
      const folderIds = await this.collectFolderTreeIds(userId, folderId);
      if (!folderIds) return null;

      // within a folder, only the sets connected to the folder tree are considered
      sets = await this.setsOfFolders(folderIds);
      folderCount = folderIds.length;

      // the name of the folder is queried separately as only IDs are collected during the traversal
      folderName = (await this.prisma.folder.findFirst({
        where: { id: folderId },
        select: { name: true }
      }))?.name ?? "";
    } else {
      // without a folder, the queue spans every set of the user
      sets = await this.setsOfUser(userId);
      folderCount = await this.prisma.folder.count({
        where: {
          authorId: userId
        }
      });
      folderName = "All sets";
    }

    // a set can be connected to multiple folders of the tree, so cards have to be deduplicated
    const uniqueCards: Prisma.CardGetPayload<{ include: { set: true, media: true } }>[] = [];
    const seenCards = new Set<string>();
    for (const set of sets) {
      for (const card of set.cards) {
        if (seenCards.has(card.id)) continue;

        seenCards.add(card.id);
        uniqueCards.push(card as Prisma.CardGetPayload<{ include: { set: true, media: true } }>);
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

    const cardMap = new Map<string, { card: Prisma.CardGetPayload<{ include: { set: true, media: true } }>, srs: SrsCardState, due: Date }>();
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

    // only cards that are scheduled for review are part of the queue
    const dueCards = allCards.filter((c) => c.due.getTime() <= now.getTime());
    const notDueCards = allCards.filter((c) => c.due.getTime() > now.getTime());

    // new cards first, then ordered by their due date
    dueCards.sort((a, b) => {
      if (a.srs.state !== b.srs.state) return a.srs.state - b.srs.state;
      if (a.due.getTime() !== b.due.getTime()) return a.due.getTime() - b.due.getTime();
      return a.card.index - b.card.index;
    });

    const parameters = this.buildParameters(user);
    const scheduler = fsrs(parameters);

    const stateCounts: Record<SrsState, number> = { [SrsState.New]: 0, [SrsState.Learning]: 0, [SrsState.Review]: 0, [SrsState.Relearning]: 0 };
    let stabilitySum = 0;
    let difficultySum = 0;
    let retrievabilitySum = 0;

    for (const card of allCards) {
      stateCounts[card.srs.state]++;

      stabilitySum += card.srs.stability;
      difficultySum += card.srs.difficulty;

      retrievabilitySum += scheduler.get_retrievability(this.toFsrsCard(card.srs), now, false);
    }

    const nextDue = notDueCards.length > 0
      ? new Date(Math.min(...notDueCards.map((c) => c.due.getTime()))).toISOString()
      : null;

    const hourInMs = 3600000;
    const dayInMs = 24 * hourInMs;

    const stats: SrsQueueStats = {
      generatedAt: now.toISOString(),
      folder: {
        scope,
        id: scope === "folder" ? folderId : null,
        name: folderName,
        folderCount,
        setCount: sets.length,
        cardCount: allCards.length,
        privateSetCount: sets.filter((s) => s.private).length
      },
      cards: {
        total: allCards.length,
        due: dueCards.length,
        notDue: notDueCards.length,
        stateCounts,
        averageStability: allCards.length > 0 ? stabilitySum / allCards.length : 0,
        averageDifficulty: allCards.length > 0 ? difficultySum / allCards.length : 0,
        averageRetrievability: allCards.length > 0 ? retrievabilitySum / allCards.length : 0,
        nextDue,
        overdueBuckets: {
          overdueMoreThanWeek: dueCards.filter((c) => now.getTime() - c.due.getTime() > 7 * dayInMs).length,
          overdueMoreThanDay: dueCards.filter((c) => now.getTime() - c.due.getTime() > dayInMs && now.getTime() - c.due.getTime() <= 7 * dayInMs).length,
          overdueMoreThanHour: dueCards.filter((c) => now.getTime() - c.due.getTime() > hourInMs && now.getTime() - c.due.getTime() <= dayInMs).length,
          overdueWithinHour: dueCards.filter((c) => now.getTime() - c.due.getTime() <= hourInMs).length
        },
        upcomingBuckets: {
          upcomingWithin24Hours: notDueCards.filter((c) => c.due.getTime() - now.getTime() <= dayInMs).length,
          upcomingWithin3Days: notDueCards.filter((c) => c.due.getTime() - now.getTime() > dayInMs && c.due.getTime() - now.getTime() <= 3 * dayInMs).length,
          upcomingWithin10Days: notDueCards.filter((c) => c.due.getTime() - now.getTime() > 3 * dayInMs && c.due.getTime() - now.getTime() <= 10 * dayInMs).length,
          upcomingWithin30Days: notDueCards.filter((c) => c.due.getTime() - now.getTime() > 10 * dayInMs && c.due.getTime() - now.getTime() <= 30 * dayInMs).length
        }
      },
      sets: sets.map((s) => {
        return {
          id: s.id,
          title: s.title,
          private: s.private,
          cardCount: s.cards.length,
          dueCount: s.cards.filter((c) => {
            const entry = cardMap.get(c.id);
            return entry && entry.due.getTime() <= now.getTime();
          }).length
        };
      }),
      reviews: await this.reviewStats(userId, uniqueCards.map((card) => card.id)),
      userParameters: {
        request_retention: user.srsRequestRetention,
        maximum_interval: user.srsMaximumInterval,
        w: (this.parseJsonArray(user.srsW) ?? []).filter((n): n is number => typeof n === "number"),
        enable_fuzz: user.srsEnableFuzz,
        enable_short_term: user.srsEnableShortTerm,
        learning_steps: (this.parseJsonArray(user.srsLearningSteps) ?? []).filter((s): s is string => typeof s === "string"),
        relearning_steps: (this.parseJsonArray(user.srsRelearningSteps) ?? []).filter((s): s is string => typeof s === "string")
      },
      schedulerParameters: this.toSrsParameters(parameters),
      schedulingPreview: dueCards.slice(0, this.previewCardLimit).map((card) => {
        const preview = scheduler.repeat(this.toFsrsCard(card.srs), now);

        return {
          cardId: card.card.id,
          term: card.card.term,
          definition: card.card.definition,
          state: card.srs.state,
          stability: card.srs.stability,
          difficulty: card.srs.difficulty,
          due: card.srs.due,
          preview: [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].map((rating) => {
            return {
              rating: rating as number as SrsRating,
              scheduled_days: preview[rating].card.scheduled_days,
              due: new Date(preview[rating].card.due).toISOString(),
              state: preview[rating].card.state as number as SrsState,
              stability: preview[rating].card.stability,
              difficulty: preview[rating].card.difficulty
            };
          })
        };
      })
    };

    return {
      cards: dueCards.map((c) => {
        return {
          card: c.card,
          srs: c.srs
        };
      }),
      stats
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

    const retrievabilityBefore = scheduler.get_retrievability(currentCard, now, false);

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

    const retrievabilityAfter = scheduler.get_retrievability(result.card, now, false);

    const stats: SrsReviewStats = {
      reviewedAt: now.toISOString(),
      before: stateRow ? this.toSrsCardState(this.rowToFsrsCard(stateRow)) : this.toSrsCardState(createEmptyCard(now)),
      after: srsState,
      retrievabilityBefore,
      retrievabilityAfter
    };

    return {
      cardId: card.id,
      rating,
      srs: srsState,
      log: this.toSrsReviewLog(rating, result.log),
      stats
    };
  }
}
