import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { SrsRating } from "@scholarsome/shared";

export class RateCardDto {
  @ApiProperty({
    description: "The ID of the card to rate",
    example: "72851aca-59ab-4d97-803b-62dccac848e0",
    minLength: 36,
    maxLength: 36
  })
  @IsUUID("4")
  @IsNotEmpty()
    cardId: string;

  @ApiProperty({
    description: "The rating to apply to the card (1 = Again, 2 = Hard, 3 = Good)",
    enum: SrsRating,
    example: SrsRating.Good
  })
  @IsEnum(SrsRating)
  @IsNotEmpty()
    rating: SrsRating;
}
