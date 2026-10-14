import { Test } from "@nestjs/testing";
import { SrsState } from "@scholarsome/shared";
import { PrismaService } from "../providers/database/prisma/prisma.service";
import { SrsService } from "./srs.service";

describe("SrsService - getQueue", () => {
  let srsService: SrsService;

  // Only the Prisma operations used by getQueue are needed, as the service is
  // never instantiated against a real database within the tests
  let prisma: {
    user: { findUnique: jest.Mock };
    set: { findUnique: jest.Mock };
    cardSrsState: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      set: { findUnique: jest.fn() },
      cardSrsState: { findMany: jest.fn() }
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shuffles cards that share the same state and due date", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    prisma.set.findUnique.mockResolvedValue({
      id: "set-1",
      authorId: "user-1",
      cards: [
        { id: "card-1", index: 0 },
        { id: "card-2", index: 1 },
        { id: "card-3", index: 2 }
      ]
    });
    // cards without a persisted state are new and all due now
    prisma.cardSrsState.findMany.mockResolvedValue([]);

    // the keys are drawn in the order the cards are retrieved, so card-2 is
    // shuffled ahead of card-1 and card-3
    jest.spyOn(Math, "random")
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9);

    const result = await srsService.getQueue("user-1", undefined, "set-1");

    expect(result?.cards.map((card) => card.card.id)).toEqual(["card-2", "card-1", "card-3"]);
  });

  it("keeps new cards first and cards with different due dates in ascending order", async () => {
    const hourInMs = 3600000;
    const soon = new Date(Date.now() - hourInMs);
    const later = new Date(Date.now() - 3 * hourInMs);

    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    prisma.set.findUnique.mockResolvedValue({
      id: "set-1",
      authorId: "user-1",
      cards: [
        { id: "card-later", index: 0 },
        { id: "card-new", index: 1 },
        { id: "card-soon", index: 2 }
      ]
    });
    prisma.cardSrsState.findMany.mockResolvedValue([
      {
        cardId: "card-later",
        due: later,
        state: 2
      },
      {
        cardId: "card-soon",
        due: soon,
        state: 2
      }
    ]);

    // the random keys are stacked against the expected order, so that only
    // the state and due date ordering can explain the result
    jest.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.9);

    const result = await srsService.getQueue("user-1", undefined, "set-1");

    expect(result?.cards.map((card) => card.card.id)).toEqual(["card-new", "card-later", "card-soon"]);
    expect(result?.cards.map((card) => card.srs.state)).toEqual([SrsState.New, SrsState.Review, SrsState.Review]);
  });

  it("shuffles ties within each due date group without mixing the groups", async () => {
    const hourInMs = 3600000;
    const soon = new Date(Date.now() - 3 * hourInMs);
    const later = new Date(Date.now() - hourInMs);

    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    prisma.set.findUnique.mockResolvedValue({
      id: "set-1",
      authorId: "user-1",
      cards: [
        { id: "review-a", index: 0 },
        { id: "review-b", index: 1 },
        { id: "review-c", index: 2 }
      ]
    });
    prisma.cardSrsState.findMany.mockResolvedValue([
      {
        cardId: "review-a",
        due: soon,
        state: 2
      },
      {
        cardId: "review-b",
        due: soon,
        state: 2
      },
      {
        cardId: "review-c",
        due: later,
        state: 2
      }
    ]);

    jest.spyOn(Math, "random")
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.5);

    const result = await srsService.getQueue("user-1", undefined, "set-1");

    expect(result?.cards.map((card) => card.card.id)).toEqual(["review-b", "review-a", "review-c"]);
  });

  it("keeps cards that are not due yet out of the queue and counts them in the buckets", async () => {
    const hourInMs = 3600000;
    const due = new Date(Date.now() - hourInMs);
    const withinHour = new Date(Date.now() + 30 * 60000);
    const within4Hours = new Date(Date.now() + 2 * hourInMs);
    const within24Hours = new Date(Date.now() + 12 * hourInMs);
    const within72Hours = new Date(Date.now() + 48 * hourInMs);

    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    prisma.set.findUnique.mockResolvedValue({
      id: "set-1",
      authorId: "user-1",
      cards: [
        { id: "card-due", index: 0 },
        { id: "card-1h", index: 1 },
        { id: "card-4h", index: 2 },
        { id: "card-24h", index: 3 },
        { id: "card-72h", index: 4 }
      ]
    });
    prisma.cardSrsState.findMany.mockResolvedValue([
      { cardId: "card-due", due, state: 2 },
      { cardId: "card-1h", due: withinHour, state: 2 },
      { cardId: "card-4h", due: within4Hours, state: 2 },
      { cardId: "card-24h", due: within24Hours, state: 2 },
      { cardId: "card-72h", due: within72Hours, state: 2 }
    ]);

    const result = await srsService.getQueue("user-1", undefined, "set-1");

    // only the due card is scheduled for review, while every card that is not
    // due yet is only counted in the bucket of its distance to the due date
    expect(result?.cards.map((card) => card.card.id)).toEqual(["card-due"]);
    expect(result?.upcomingBuckets).toEqual({
      upcomingWithin1Hour: 1,
      upcomingWithin4Hours: 1,
      upcomingWithin24Hours: 1,
      upcomingWithin72Hours: 1
    });
  });
});
