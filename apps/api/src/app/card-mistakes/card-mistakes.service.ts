import { Injectable } from "@nestjs/common";
import { PrismaService } from "../providers/database/prisma/prisma.service";
import { Prisma, CardMistake as PrismaCardMistake } from "@prisma/client";
import { CardMistake } from "@scholarsome/shared";

@Injectable()
export class CardMistakesService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * Queries the database for a unique cardMistake
   *
   * @param cardMistakeWhereUniqueInput Prisma `CardMistakeWhereUniqueInput` selector object
   *
   * @returns Queried `CardMistake` object
   */
  async cardMistake(
      cardMistakeWhereUniqueInput: Prisma.CardMistakeWhereUniqueInput
  ): Promise<CardMistake | null> {
    return this.prisma.cardMistake.findUnique({
      where: cardMistakeWhereUniqueInput,
      include: {
        set: true,
        card: true
      }
    });
  }

  /**
   * Queries the database for multiple cardMistakes
   *
   * @param params.skip Optional, Prisma skip selector
   * @param params.take Optional, Prisma take selector
   * @param params.cursor Optional, Prisma cursor selector
   * @param params.where Optional, Prisma where selector
   * @param params.orderBy Optional, Prisma orderBy selector
   *
   * @returns Array of queried `CardMistake` objects
   */
  async cardMistakes(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CardMistakeWhereUniqueInput;
    where?: Prisma.CardMistakeWhereInput;
    orderBy?: Prisma.CardMistakeOrderByWithRelationInput;
  }): Promise<CardMistake[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.cardMistake.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        set: true,
        card: true
      }
    });
  }

  /**
   * Creates a cardMistake in the database
   *
   * @param data Prisma `CardMistakeCreateInput` selector
   *
   * @returns Created `CardMistake` object
   */
  async createCardMistake(data: Prisma.CardMistakeCreateInput): Promise<PrismaCardMistake> {
    return this.prisma.cardMistake.create({
      data
    });
  }
}
