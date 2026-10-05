import { Test } from "@nestjs/testing";
import { SrsRating, SrsState } from "@scholarsome/shared";
import { PrismaService } from "../providers/database/prisma/prisma.service";
import { SrsService } from "./srs.service";

describe("SrsService - getSetReviewInfo", () => {
  let srsService: SrsService;

  // Only the Prisma operations used by getSetReviewInfo are needed, as the
  // service is never instantiated against a real database within the tests
  let prisma: {
    set: { findUnique: jest.Mock };
    cardSrsState: { findMany: jest.Mock };
    cardSrsReviewLog: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      set: { findUnique: jest.fn() },
      cardSrsState: { findMany: jest.fn() },
      cardSrsReviewLog: { findMany: jest.fn() }
    };

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

  it("returns null when the set does not exist", async () => {
    prisma.set.findUnique.mockResolvedValue(null);

    await expect(srsService.getSetReviewInfo("user-1", "set-1")).resolves.toBeNull();
  });

  it("returns every card as new when the user has not reviewed the set yet", async () => {
    prisma.set.findUnique.mockResolvedValue({ id: "set-1", cards: [{ id: "card-1", index: 0 }] });
    prisma.cardSrsState.findMany.mockResolvedValue([]);
    prisma.cardSrsReviewLog.findMany.mockResolvedValue([]);

    await expect(srsService.getSetReviewInfo("user-1", "set-1")).resolves.toEqual({
      cards: [
        {
          cardId: "card-1",
          due: null,
          state: SrsState.New,
          lapses: 0,
          lastReview: null,
          totalReviews: 0,
          againCount: 0,
          hardCount: 0,
          goodCount: 0,
          history: []
        }
      ]
    });
  });

  it("includes cards that were never reviewed as new and orders the cards by their index", async () => {
    prisma.set.findUnique.mockResolvedValue({
      id: "set-1",
      cards: [
        { id: "card-2", index: 1 },
        { id: "card-1", index: 0 }
      ]
    });
    prisma.cardSrsState.findMany.mockResolvedValue([
      {
        cardId: "card-2",
        due: new Date("2026-10-10T00:00:00Z"),
        state: 2,
        lapses: 0,
        lastReview: new Date("2026-09-10T00:00:00Z")
      }
    ]);
    prisma.cardSrsReviewLog.findMany.mockResolvedValue([]);

    const result = await srsService.getSetReviewInfo("user-1", "set-1");

    // card-1 comes first as the first card of the set, even though only
    // card-2 has been reviewed
    expect(result?.cards.map((card) => card.cardId)).toEqual(["card-1", "card-2"]);

    expect(result?.cards[0]).toEqual({
      cardId: "card-1",
      due: null,
      state: SrsState.New,
      lapses: 0,
      lastReview: null,
      totalReviews: 0,
      againCount: 0,
      hardCount: 0,
      goodCount: 0,
      history: []
    });
    expect(result?.cards[1].due).toBe("2026-10-10T00:00:00.000Z");
  });

  it("combines the SRS state of a card with the counts and history of its reviews", async () => {
    prisma.set.findUnique.mockResolvedValue({ id: "set-1", cards: [{ id: "card-1" }] });
    prisma.cardSrsState.findMany.mockResolvedValue([
      {
        cardId: "card-1",
        due: new Date("2026-10-10T00:00:00Z"),
        state: 2,
        lapses: 1,
        lastReview: new Date("2026-09-10T00:00:00Z")
      }
    ]);
    prisma.cardSrsReviewLog.findMany.mockResolvedValue([
      {
        cardId: "card-1",
        rating: 1,
        state: 1,
        review: new Date("2026-09-01T00:00:00Z"),
        due: new Date("2026-09-01T00:00:00Z"),
        scheduledDays: 0
      },
      {
        cardId: "card-1",
        rating: 2,
        state: 2,
        review: new Date("2026-09-02T00:00:00Z"),
        due: new Date("2026-09-03T00:00:00Z"),
        scheduledDays: 1
      },
      {
        cardId: "card-1",
        rating: 3,
        state: 2,
        review: new Date("2026-09-03T00:00:00Z"),
        due: new Date("2026-09-10T00:00:00Z"),
        scheduledDays: 7
      },
      {
        cardId: "card-1",
        rating: 3,
        state: 2,
        review: new Date("2026-09-10T00:00:00Z"),
        due: new Date("2026-10-20T00:00:00Z"),
        scheduledDays: 40
      }
    ]);

    await expect(srsService.getSetReviewInfo("user-1", "set-1")).resolves.toEqual({
      cards: [
        {
          cardId: "card-1",
          due: "2026-10-10T00:00:00.000Z",
          state: SrsState.Review,
          lapses: 1,
          lastReview: "2026-09-10T00:00:00.000Z",
          totalReviews: 4,
          againCount: 1,
          hardCount: 1,
          goodCount: 2,
          history: [
            {
              rating: SrsRating.Again,
              state: SrsState.Learning,
              review: "2026-09-01T00:00:00.000Z",
              due: "2026-09-01T00:00:00.000Z",
              scheduledDays: 0
            },
            {
              rating: SrsRating.Hard,
              state: SrsState.Review,
              review: "2026-09-02T00:00:00.000Z",
              due: "2026-09-03T00:00:00.000Z",
              scheduledDays: 1
            },
            {
              rating: SrsRating.Good,
              state: SrsState.Review,
              review: "2026-09-03T00:00:00.000Z",
              due: "2026-09-10T00:00:00.000Z",
              scheduledDays: 7
            },
            {
              rating: SrsRating.Good,
              state: SrsState.Review,
              review: "2026-09-10T00:00:00.000Z",
              due: "2026-10-20T00:00:00.000Z",
              scheduledDays: 40
            }
          ]
        }
      ]
    });
  });

  it("includes cards whose review logs exist without a stored SRS state", async () => {
    prisma.set.findUnique.mockResolvedValue({ id: "set-1", cards: [{ id: "card-1" }] });
    prisma.cardSrsState.findMany.mockResolvedValue([]);
    prisma.cardSrsReviewLog.findMany.mockResolvedValue([
      {
        cardId: "card-1",
        rating: 3,
        state: 2,
        review: new Date("2026-09-10T00:00:00Z"),
        due: new Date("2026-09-17T00:00:00Z"),
        scheduledDays: 7
      }
    ]);

    await expect(srsService.getSetReviewInfo("user-1", "set-1")).resolves.toEqual({
      cards: [
        {
          cardId: "card-1",
          due: null,
          state: null,
          lapses: 0,
          lastReview: "2026-09-10T00:00:00.000Z",
          totalReviews: 1,
          againCount: 0,
          hardCount: 0,
          goodCount: 1,
          history: [
            {
              rating: SrsRating.Good,
              state: SrsState.Review,
              review: "2026-09-10T00:00:00.000Z",
              due: "2026-09-17T00:00:00.000Z",
              scheduledDays: 7
            }
          ]
        }
      ]
    });
  });

  it("caps the review history of a card to its most recent reviews", async () => {
    prisma.set.findUnique.mockResolvedValue({ id: "set-1", cards: [{ id: "card-1" }] });
    prisma.cardSrsState.findMany.mockResolvedValue([]);

    const logs = [];
    for (let i = 0; i < 60; i++) {
      logs.push({
        cardId: "card-1",
        rating: 3,
        state: 2,
        review: new Date(2026, 0, 1 + i),
        due: new Date(2026, 0, 2 + i),
        scheduledDays: i
      });
    }
    prisma.cardSrsReviewLog.findMany.mockResolvedValue(logs);

    const result = await srsService.getSetReviewInfo("user-1", "set-1");

    expect(result?.cards[0].totalReviews).toBe(60);
    expect(result?.cards[0].history).toHaveLength(50);
    // the history starts at the 11th review, as the 10 oldest reviews are dropped
    expect(result?.cards[0].history[0].scheduledDays).toBe(10);
    expect(result?.cards[0].history[49].scheduledDays).toBe(59);
  });

  it("only returns reviews of the given user for the given set", async () => {
    prisma.set.findUnique.mockResolvedValue({ id: "set-1", cards: [{ id: "card-1" }] });
    prisma.cardSrsState.findMany.mockResolvedValue([]);
    prisma.cardSrsReviewLog.findMany.mockResolvedValue([]);

    await srsService.getSetReviewInfo("user-1", "set-1");

    expect(prisma.cardSrsState.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        cardId: { in: ["card-1"] }
      }
    });
    expect(prisma.cardSrsReviewLog.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        setId: "set-1"
      },
      orderBy: { review: "asc" }
    });
  });
});
