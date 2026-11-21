import { Module } from "@nestjs/common";
import { DatabaseModule } from "../providers/database/database.module";
import { AuthModule } from "../auth/auth.module";
import { SrsController } from "./srs.controller";
import { SrsService } from "./srs.service";

@Module({
  imports: [
    AuthModule,
    DatabaseModule
  ],
  controllers: [SrsController],
  providers: [SrsService],
  exports: [SrsService]
})
export class SrsModule {}
