import { Prisma } from "../../../../generated/prisma/browser";

export type CardMistake = Prisma.CardMistakeGetPayload<{
  include: {
    set: true,
    card: true
  }
}>;
