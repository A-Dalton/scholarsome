/* eslint-disable */

import { Card } from "../database";

/**
 * Ratings that the user can give to a card during an SRS review.
 * Values map 1:1 to the ts-fsrs `Rating` enum.
 */
export enum SrsRating {
  /**
   * "Don't know" — maps to ts-fsrs `Rating.Again`
   */
  Again = 1,
  /**
   * "Took a while" — maps to ts-fsrs `Rating.Hard`
   */
  Hard = 2,
  /**
   * "Knew right away" — maps to ts-fsrs `Rating.Good`
   */
  Good = 3
}

/**
 * States of a card within the SRS.
 * Values map 1:1 to the ts-fsrs `State` enum.
 */
export enum SrsState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3
}

/**
 * Serializable representation of a ts-fsrs `Card` (the scheduling state of a card).
 * Dates are ISO 8601 encoded strings.
 */
export interface SrsCardState {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: SrsState;
  last_review: string | null;
}

/**
 * A card as stored in the database, combined with its SRS scheduling state.
 */
export interface SrsCard {
  card: Card;
  srs: SrsCardState;
}

/**
 * Serializable representation of a ts-fsrs `RecordLogItem` (the log of a single review).
 * Dates are ISO 8601 encoded strings.
 */
export interface SrsReviewLog {
  rating: SrsRating;
  state: SrsState;
  due: string;
  review: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  last_elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
}

/**
 * The ts-fsrs parameters (`FSRSParameters`) of a user, as stored in the database.
 * Arrays are stored as JSON, dates are not part of the parameters.
 */
export interface SrsParameters {
  request_retention: number;
  maximum_interval: number;
  w: number[];
  enable_fuzz: boolean;
  enable_short_term: boolean;
  learning_steps: string[];
  relearning_steps: string[];
}

/**
 * Debug statistics of a SRS queue request.
 * Intended for development purposes to plan the next steps of the SRS.
 */
export interface SrsQueueStats {
  /**
   * ISO 8601 encoded time at which the statistics were computed
   */
  generatedAt: string;
  /**
   * Statistics of the folder (and recursively its subfolders) the queue was built for.
   * When the queue was built across all sets of the user, the statistics
   * span every folder and `id` is null.
   */
  folder: {
    /**
     * Whether the statistics are scoped to a single folder or to all sets of the user
     */
    scope: "folder" | "all";
    id: string | null;
    name: string;
    /**
     * Amount of folders within the scope, including the requested folder
     */
    folderCount: number;
    setCount: number;
    cardCount: number;
    privateSetCount: number;
  };
  /**
   * Statistics of all cards found within the folder tree
   */
  cards: {
    total: number;
    due: number;
    notDue: number;
    stateCounts: {
      [SrsState.New]: number;
      [SrsState.Learning]: number;
      [SrsState.Review]: number;
      [SrsState.Relearning]: number;
    };
    averageStability: number;
    averageDifficulty: number;
    averageRetrievability: number;
    /**
     * ISO 8601 encoded earliest due date of cards that are not yet due
     */
    nextDue: string | null;
    /**
     * Amount of due cards bucketed by how far their due date is in the past
     */
    overdueBuckets: {
      overdueMoreThanWeek: number;
      overdueMoreThanDay: number;
      overdueMoreThanHour: number;
      overdueWithinHour: number;
    };
  };
  /**
   * Per-set breakdown of the cards within the folder tree
   */
  sets: {
    id: string;
    title: string;
    private: boolean;
    cardCount: number;
    dueCount: number;
  }[];
  /**
   * Review history statistics of the cards within the scope
   */
  reviews: {
    total: number;
    ratingCounts: {
      [SrsRating.Again]: number;
      [SrsRating.Hard]: number;
      [SrsRating.Good]: number;
    };
    /**
     * ISO 8601 encoded time of the most recent review, or null if no card was reviewed yet
     */
    lastReview: string | null;
  };
  /**
   * The SRS parameters of the authenticated user, as stored in the database
   */
  userParameters: SrsParameters;
  /**
   * The parameters the ts-fsrs scheduler was effectively created with
   */
  schedulerParameters: SrsParameters;
  /**
   * For the first few due cards, a preview of what each possible rating would schedule
   */
  schedulingPreview: {
    cardId: string;
    term: string;
    definition: string;
    state: SrsState;
    stability: number;
    difficulty: number;
    due: string;
    preview: {
      rating: SrsRating;
      scheduled_days: number;
      due: string;
      state: SrsState;
      stability: number;
      difficulty: number;
    }[];
  }[];
}

/**
 * Data returned when requesting the review queue of a folder
 */
export interface SrsQueueData {
  /**
   * The cards that are scheduled for review, ordered new cards first
   */
  cards: SrsCard[];
  stats: SrsQueueStats;
}

/**
 * Debug statistics of a single SRS review request
 */
export interface SrsReviewStats {
  reviewedAt: string;
  /**
   * State of the card before the rating was applied
   */
  before: SrsCardState;
  /**
   * State of the card after the rating was applied
   */
  after: SrsCardState;
  retrievabilityBefore: number;
  retrievabilityAfter: number;
}

/**
 * Data returned when rating a card within the SRS
 */
export interface SrsReviewData {
  cardId: string;
  rating: SrsRating;
  /**
   * The SRS state of the card after the rating was applied
   */
  srs: SrsCardState;
  log: SrsReviewLog;
  stats: SrsReviewStats;
}
