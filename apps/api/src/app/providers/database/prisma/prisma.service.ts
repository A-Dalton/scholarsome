import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@scholarsome/prisma/server";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    const adapter = new PrismaMariaDb(configService.get<string>("DATABASE_URL"));
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
