import { ApiProperty } from "@nestjs/swagger";

export class SrsReviewHistoryEntryEntity {
  @ApiProperty({
    description: "Rating the review was rated with (1 = Again, 2 = Hard, 3 = Good)",
    example: 3
  })
    rating: number;

  @ApiProperty({
    description: "State of the card at the time of the review (0 = New, 1 = Learning, 2 = Review, 3 = Relearning)",
    example: 2
  })
    state: number;

  @ApiProperty({
    description: "ISO 8601 encoded time of the review",
    example: "1970-01-01T00:00:00.000Z"
  })
    review: string;

  @ApiProperty({
    description: "ISO 8601 encoded time for when the card was scheduled to be reviewed next",
    example: "1970-01-01T00:00:00.000Z"
  })
    due: string;

  @ApiProperty({
    description: "Amount of days the card was scheduled into the future",
    example: 0
  })
    scheduledDays: number;
}

export class SrsCardReviewInfoEntity {
  @ApiProperty({
    description: "The ID of the card",
    example: "72851aca-59ab-4d97-803b-62dccac848e0"
  })
    cardId: string;

  @ApiProperty({
    description: "ISO 8601 encoded time for when the card is due next, or null when the card was never scheduled",
    example: "1970-01-01T00:00:00.000Z",
    nullable: true
  })
    due: string | null;

  @ApiProperty({
    description: "Current state of the card (0 = New, 1 = Learning, 2 = Review, 3 = Relearning), where New is also returned for cards that have never been reviewed, or null when the state could not be determined",
    example: 2,
    nullable: true
  })
    state: number | null;

  @ApiProperty({
    description: "Amount of times the card has been forgotten",
    example: 0
  })
    lapses: number;

  @ApiProperty({
    description: "ISO 8601 encoded time of the last review, or null",
    example: "1970-01-01T00:00:00.000Z",
    nullable: true
  })
    lastReview: string | null;

  @ApiProperty({
    description: "Amount of reviews the card has received in total",
    example: 0
  })
    totalReviews: number;

  @ApiProperty({
    description: "Amount of reviews rated with Again",
    example: 0
  })
    againCount: number;

  @ApiProperty({
    description: "Amount of reviews rated with Hard",
    example: 0
  })
    hardCount: number;

  @ApiProperty({
    description: "Amount of reviews rated with Good",
    example: 0
  })
    goodCount: number;

  @ApiProperty({
    description: "The most recent reviews of the card, ordered from oldest to newest",
    type: [SrsReviewHistoryEntryEntity]
  })
    history: SrsReviewHistoryEntryEntity[];
}

export class SrsSetReviewInfoDataEntity {
  @ApiProperty({
    description: "The review information of every card of the set that has already been reviewed",
    type: [SrsCardReviewInfoEntity]
  })
    cards: SrsCardReviewInfoEntity[];
}

export class SrsReviewInfoSuccessResponse {
  @ApiProperty({
    description: "Denotes whether the request was successful or not",
    example: "success"
  })
    status: string;

  @ApiProperty({
    description: "Response data",
    type: SrsSetReviewInfoDataEntity
  })
    data: SrsSetReviewInfoDataEntity;
}
