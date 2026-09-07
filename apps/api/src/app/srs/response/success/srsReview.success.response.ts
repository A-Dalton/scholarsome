import { ApiProperty } from "@nestjs/swagger";
import { SrsCardStateEntity } from "./srsQueue.success.response";

export class SrsReviewDataEntity {
  @ApiProperty({
    description: "The ID of the card that was rated",
    example: "72851aca-59ab-4d97-803b-62dccac848e0"
  })
    cardId: string;

  @ApiProperty({
    description: "The rating that was applied to the card",
    example: 3
  })
    rating: number;

  @ApiProperty({
    description: "The SRS state of the card after the rating was applied",
    type: SrsCardStateEntity
  })
    srs: SrsCardStateEntity;

  @ApiProperty({
    description: "The review log of ts-fsrs",
    type: Object
  })
    log: object;

  @ApiProperty({
    description: "Statistics regarding the review for debug purposes",
    type: Object
  })
    stats: object;
}

export class SrsReviewSuccessResponse {
  @ApiProperty({
    description: "Denotes whether the request was successful or not",
    example: "success"
  })
    status: string;

  @ApiProperty({
    description: "Response data",
    type: SrsReviewDataEntity
  })
    data: SrsReviewDataEntity;
}
