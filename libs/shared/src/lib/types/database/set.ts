import { Prisma } from "../../../../generated/prisma/browser";

export type Set = Prisma.SetGetPayload<{
  include: {
    cards: true,
    folders: true,
    author: {
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true
      }
    }
  }
}>;
