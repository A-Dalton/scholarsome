import { Prisma } from "@prisma/client";

const cardMistakeWithRelations = Prisma.validator<Prisma.CardMistakeArgs>()({
  include: {
    set: true,
    card: true
  }
});

export type CardMistake = Prisma.CardMistakeGetPayload<typeof cardMistakeWithRelations>;
