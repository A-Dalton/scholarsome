import { ApiProperty } from "@nestjs/swagger";

export class CardMistakeCardEntity {
  @ApiProperty({
    description: "The ID of the card",
    example: "27758237-5f57-4f6c-b483-6161056dad76"
  })
    id: string;

  @ApiProperty({
    description: "The front or \"term\" of the card",
    example: "The term of the card"
  })
    term: string;

  @ApiProperty({
    description: "The back or \"definition\" of the card",
    example: "The definition of the card"
  })
    definition: string;
}
