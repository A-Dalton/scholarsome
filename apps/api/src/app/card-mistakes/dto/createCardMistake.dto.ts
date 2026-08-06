import {
  IsNotEmpty,
  IsUUID
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCardMistakeDto {
  @ApiProperty({
    description: "The ID of the card that was marked as unknown",
    example: "27758237-5f57-4f6c-b483-6161056dad76",
    minLength: 36,
    maxLength: 36
  })
  @IsUUID("4")
  @IsNotEmpty()
    cardId: string;
}
