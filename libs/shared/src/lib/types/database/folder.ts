import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const folderWithRelations = Prisma.validator<Prisma.FolderArgs>()({
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
});

export type Folder = Prisma.FolderGetPayload<typeof folderWithRelations>;
