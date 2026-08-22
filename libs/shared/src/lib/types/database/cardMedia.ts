import { Prisma } from "../../../../generated/prisma/browser";

export type CardMedia = Prisma.CardMediaGetPayload<{
  include: { card: true }
}>;
