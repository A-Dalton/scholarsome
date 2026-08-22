import { Prisma } from "../../../../generated/prisma/browser";

export type User = Prisma.UserGetPayload<{
  include: {
    sets: true,
    folders: true
  }
}>;
