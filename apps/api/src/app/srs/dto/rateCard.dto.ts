import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, Max, Min, IsUUID } from "class-validator";

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
    example: 3,
    minimum: 1,
    maximum: 3
  })
  @IsNumber()
  @Min(1)
  @Max(3)
  @IsNotEmpty()
    rating: number;
}
