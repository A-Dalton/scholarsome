import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cardMediaWithRelations = Prisma.validator<Prisma.CardMediaArgs>()({
  include: { card: true }
});

export type CardMedia = Prisma.CardMediaGetPayload<typeof cardMediaWithRelations>;
