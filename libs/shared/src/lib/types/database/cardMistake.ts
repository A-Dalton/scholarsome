import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cardMistakeWithRelations = Prisma.validator<Prisma.CardMistakeArgs>()({
  include: {
    set: true,
    card: true
  }
});

export type CardMistake = Prisma.CardMistakeGetPayload<typeof cardMistakeWithRelations>;
