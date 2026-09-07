import { ApiProperty } from "@nestjs/swagger";

export class SrsCardStateEntity {
  @ApiProperty({
    description: "ISO 8601 encoded time for when the card is scheduled to be reviewed next",
    example: "1970-01-01T00:00:00.000Z"
  })
    due: string;

  @ApiProperty({
    description: "Stability of the card within the SRS",
    example: 0
  })
    stability: number;

  @ApiProperty({
    description: "Difficulty of the card within the SRS",
    example: 0
  })
    difficulty: number;

  @ApiProperty({
    description: "Amount of days that have passed since the last review",
    example: 0
  })
    elapsed_days: number;

  @ApiProperty({
    description: "Amount of days the card was scheduled into the future",
    example: 0
  })
    scheduled_days: number;

  @ApiProperty({
    description: "Current (re)learning step of the card",
    example: 0
  })
    learning_steps: number;

  @ApiProperty({
    description: "Amount of times the card has been reviewed",
    example: 0
  })
    reps: number;

  @ApiProperty({
    description: "Amount of times the card has been forgotten",
    example: 0
  })
    lapses: number;

  @ApiProperty({
    description: "State of the card (0 = New, 1 = Learning, 2 = Review, 3 = Relearning)",
    example: 0
  })
    state: number;

  @ApiProperty({
    description: "ISO 8601 encoded time of the last review, or null",
    example: "1970-01-01T00:00:00.000Z",
    nullable: true
  })
    last_review: string | null;
}

export class SrsCardEntity {
  @ApiProperty({
    description: "The card as stored in the database",
    type: Object
  })
    card: object;

  @ApiProperty({
    description: "The SRS state of the card",
    type: SrsCardStateEntity
  })
    srs: SrsCardStateEntity;
}

export class SrsQueueDataEntity {
  @ApiProperty({
    description: "The cards scheduled for review",
    type: [SrsCardEntity]
  })
    cards: SrsCardEntity[];

  @ApiProperty({
    description: "Statistics regarding the SRS for debug purposes",
    type: Object
  })
    stats: object;
}

export class SrsQueueSuccessResponse {
  @ApiProperty({
    description: "Denotes whether the request was successful or not",
    example: "success"
  })
    status: string;

  @ApiProperty({
    description: "Response data",
    type: SrsQueueDataEntity
  })
    data: SrsQueueDataEntity;
}
