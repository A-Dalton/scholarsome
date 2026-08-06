import { ApiProperty } from "@nestjs/swagger";
import { CardMistakeCardEntity } from "../card.mistake.card.entity";
import { CardMistakeSetEntity } from "../card.mistake.set.entity";

export class CardMistakesSuccessResponse {
  @ApiProperty({
    description: "Denotes whether the request was successful or not",
    example: "success"
  })
    status: string;

  @ApiProperty({
    description: "Response data",
    type: [CardMistakeCardEntity]
  })
    data: CardMistakeCardEntity[];

  @ApiProperty({
    description: "The set that the mistakes belong to",
    type: CardMistakeSetEntity
  })
    set: CardMistakeSetEntity;

  @ApiProperty({
    description: "ISO 8601 encoded time for when the mistake was made",
    example: "1970-01-01T00:00:00.000Z"
  })
    createdAt: string;
}
