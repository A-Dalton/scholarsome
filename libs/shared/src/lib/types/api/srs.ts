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
 * Amount of cards that are not yet due, bucketed by how far their due date is
 * in the future. The buckets are exclusive ranges, e.g. cards within the next
 * 4 hours are not part of the 24 hours bucket.
 */
export interface SrsUpcomingBuckets {
  upcomingWithin4Hours: number;
  upcomingWithin24Hours: number;
  upcomingWithin3Days: number;
  upcomingWithin7Days: number;
}

/**
 * Data returned when requesting the review queue of a folder
 */
export interface SrsQueueData {
  /**
   * The cards that are scheduled for review, ordered new cards first
   */
  cards: SrsCard[];
  /**
   * Amount of cards that are not yet due, bucketed by how far their due date is in the future
   */
  upcomingBuckets: SrsUpcomingBuckets;
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
}
