import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const userWithRelations = Prisma.validator<Prisma.UserArgs>()({
  include: {
    sets: true,
    folders: true
  }
});

export type User = Prisma.UserGetPayload<typeof userWithRelations>;
