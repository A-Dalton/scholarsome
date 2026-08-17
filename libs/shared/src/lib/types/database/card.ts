import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cardWithRelations = Prisma.validator<Prisma.CardArgs>()({
  include: { set: true, media: true }
});

export type Card = Prisma.CardGetPayload<typeof cardWithRelations>;
