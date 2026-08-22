import { Prisma } from "../../../../generated/prisma/browser";

export type Folder = Prisma.FolderGetPayload<{
  include: {
    sets: true,
    subfolders: true,
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
