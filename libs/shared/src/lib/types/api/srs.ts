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
 * The review queue returns the card rows without the `set` and `media`
 * relations included in the `Card` type, as they are not needed for reviewing.
 */
export interface SrsCard {
  card: Omit<Card, "set" | "media">;
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

/**
 * A single review of a card, part of its review history
 */
export interface SrsReviewHistoryEntry {
  rating: SrsRating;
  state: SrsState;
  /**
   * ISO 8601 encoded time of the review
   */
  review: string;
  /**
   * ISO 8601 encoded time for when the card was scheduled to be reviewed next
   */
  due: string;
  /**
   * Amount of days the card was scheduled into the future
   */
  scheduledDays: number;
}

/**
 * Review information of a single card of the authenticated user, combining its
 * current SRS state with the rating counts and history of its review logs
 */
export interface SrsCardReviewInfo {
  cardId: string;
  /**
   * ISO 8601 encoded time for when the card is due next, or null when the card was never scheduled
   */
  due: string | null;
  /**
   * Current state of the card, where New is also returned for cards that have
   * never been reviewed, or null when the state could not be determined
   */
  state: SrsState | null;
  /**
   * Amount of times the card has been forgotten
   */
  lapses: number;
  /**
   * ISO 8601 encoded time of the last review, or null
   */
  lastReview: string | null;
  /**
   * Amount of reviews the card has received in total, which can exceed the
   * amount of entries of the review history as the latter is capped
   */
  totalReviews: number;
  /**
   * Amount of reviews rated with each rating
   */
  againCount: number;
  hardCount: number;
  goodCount: number;
  /**
   * The most recent reviews of the card, ordered from oldest to newest
   */
  history: SrsReviewHistoryEntry[];
}

/**
 * Data returned when requesting the review information of the cards of a set
 */
export interface SrsSetReviewInfoData {
  /**
   * The review information of every card of the set that has already been reviewed
   */
  cards: SrsCardReviewInfo[];
}
