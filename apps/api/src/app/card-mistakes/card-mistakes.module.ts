import { forwardRef, Module } from "@nestjs/common";
import { DatabaseModule } from "../providers/database/database.module";
import { CardMistakesController } from "./card-mistakes.controller";
import { CardMistakesService } from "./card-mistakes.service";
import { AuthModule } from "../auth/auth.module";
import { CardsModule } from "../cards/cards.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    forwardRef(() => CardsModule)
  ],
  controllers: [CardMistakesController],
  providers: [CardMistakesService],
  exports: [CardMistakesService]
})
export class CardMistakesModule {}
