import { Prisma } from "../../../../generated/prisma/browser";

export type Card = Prisma.CardGetPayload<{
  include: { set: true, media: true }
}>;
