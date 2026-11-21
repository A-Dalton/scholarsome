import { Test } from "@nestjs/testing";
import { SrsRating, SrsState } from "@scholarsome/shared";
import { PrismaService } from "../providers/database/prisma/prisma.service";
import { SrsService } from "./srs.service";

describe("SrsService - rate", () => {
  let srsService: SrsService;
  let stateRow: {
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
  } | null;

  const prisma = {
    user: { findUnique: jest.fn() },
    card: { findUnique: jest.fn() },
    cardSrsState: { findUnique: jest.fn(), upsert: jest.fn() },
    cardSrsReviewLog: { create: jest.fn() },
    $transaction: jest.fn()
  };

  beforeEach(async () => {
    stateRow = null;

    prisma.user.findUnique.mockResolvedValue({
      srsRequestRetention: 0.96,
      srsMaximumInterval: 60,
      srsW: null,
      srsEnableFuzz: null,
      srsEnableShortTerm: true,
      srsLearningSteps: ["23h", "1d"],
      srsRelearningSteps: ["23h"]
    });
    prisma.card.findUnique.mockResolvedValue({
      id: "card-1",
      setId: "set-1",
      set: { authorId: "user-1" }
    });
    prisma.cardSrsState.findUnique.mockImplementation(() => Promise.resolve(stateRow));
    prisma.cardSrsState.upsert.mockResolvedValue({});
    prisma.cardSrsReviewLog.create.mockResolvedValue({});
    prisma.$transaction.mockResolvedValue([]);

    const module = await Test.createTestingModule({
      providers: [
        SrsService,
        {
          provide: PrismaService,
          useValue: prisma
        }
      ]
    }).compile();

    srsService = await module.get(SrsService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /**
   * Replays a review history at the card's due date and returns the last delay
   * between the last review and the next due date.
   */
  async function replay(ratings: SrsRating[]): Promise<{ state: number, delayHours: number }> {
    stateRow = null;
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-01T00:00:00Z"));

    let lastReview = new Date("2026-10-01T00:00:00Z");

    for (const rating of ratings) {
      if (stateRow) jest.setSystemTime(stateRow.due);

      const result = await srsService.rate("user-1", "card-1", rating);
      if (!result) throw new Error("rate returned null");

      lastReview = new Date(result.srs.last_review as string);
      stateRow = {
        due: new Date(result.srs.due),
        stability: result.srs.stability,
        difficulty: result.srs.difficulty,
        elapsedDays: result.srs.elapsed_days,
        scheduledDays: result.srs.scheduled_days,
        learningSteps: result.srs.learning_steps,
        reps: result.srs.reps,
        lapses: result.srs.lapses,
        state: result.srs.state as number,
        lastReview: result.srs.last_review ? new Date(result.srs.last_review) : null
      };
    }

    if (!stateRow) throw new Error("replay produced no state");

    return {
      state: stateRow.state,
      delayHours: (stateRow.due.getTime() - lastReview.getTime()) / 3600000
    };
  }

  it("advances cards rated Took a while through the learning steps instead of keeping them on the first step", async () => {
    const hardHistory = await replay([
      SrsRating.Hard,
      SrsRating.Hard,
      SrsRating.Again,
      SrsRating.Hard,
      SrsRating.Hard,
      SrsRating.Hard,
      SrsRating.Hard,
      SrsRating.Hard,
      SrsRating.Hard
    ]);

    const againHistory = await replay([
      SrsRating.Again,
      SrsRating.Again,
      SrsRating.Hard,
      SrsRating.Hard,
      SrsRating.Again,
      SrsRating.Hard,
      SrsRating.Hard,
      SrsRating.Again,
      SrsRating.Hard,
      SrsRating.Again
    ]);

    expect(hardHistory.state).toBe(SrsState.Review);
    expect(againHistory.state).toBe(SrsState.Relearning);

    // the card with repeated "Took a while" ratings is scheduled later than
    // the card whose last review was "Don't know"
    expect(hardHistory.delayHours).toBeGreaterThan(againHistory.delayHours);
  });

  it("keeps a card rated Don't know on the first learning step", async () => {
    const result = await replay([SrsRating.Again]);

    expect(result.state).toBe(SrsState.Learning);
    expect(result.delayHours).toBe(23);
  });

  it("grows Got it intervals gradually for the Once per day preset", async () => {
    // two Got it ratings plus one Took a while keep the card in days, not months
    const few = await replay([SrsRating.Good, SrsRating.Good, SrsRating.Hard]);
    expect(few.delayHours).toBeLessThan(7 * 24);

    // six Got it ratings approach one to two months, not years
    const six = await replay([
      SrsRating.Good,
      SrsRating.Good,
      SrsRating.Good,
      SrsRating.Good,
      SrsRating.Good,
      SrsRating.Good
    ]);
    expect(six.delayHours).toBeGreaterThanOrEqual(30 * 24);
    expect(six.delayHours).toBeLessThanOrEqual(60 * 24);
  });
});
