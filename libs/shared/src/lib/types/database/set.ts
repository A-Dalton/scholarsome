import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setWithRelations = Prisma.validator<Prisma.SetArgs>()({
  include: { cards: true, folders: true, author: {
    select: {
      id: true,
      username: true,
      createdAt: true,
      updatedAt: true
    }
  } }
});

export type Set = Prisma.SetGetPayload<typeof setWithRelations>;
