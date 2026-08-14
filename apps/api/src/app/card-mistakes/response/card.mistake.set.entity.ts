import { ApiProperty } from "@nestjs/swagger";

export class CardMistakeSetEntity {
  @ApiProperty({
    description: "The ID of the set",
    example: "77a72340-0b91-499e-9a06-0eee498d5aec"
  })
    id: string;

  @ApiProperty({
    description: "The title or name of the set",
    example: "Example set"
  })
    title: string;
}
