import { SrsCadence } from "../../../../generated/prisma/browser";

export { SrsCadence };

/**
 * The SRS review cadence options available to users, in the order they are
 * presented in the settings
 */
export const srsCadenceOptions: { value: SrsCadence, label: string }[] = [
  { value: SrsCadence.FOUR_TIMES_A_DAY, label: "Four times a day" },
  { value: SrsCadence.TWO_TIMES_A_DAY, label: "Two times a day" },
  { value: SrsCadence.ONCE_PER_DAY, label: "Once per day" },
  { value: SrsCadence.EVERY_TWO_DAYS, label: "Every two days" },
  { value: SrsCadence.EVERY_FOUR_DAYS, label: "Every four days" },
  { value: SrsCadence.ONCE_PER_WEEK, label: "Once per week" }
];

/**
 * Maps each SRS review cadence to the ts-fsrs parameters that are written to
 * the SRS parameter columns of a user when the cadence is selected.
 *
 * The first learning/relearning step keeps a card rated "Don't know" in the
 * Learning/Relearning state until it is due again: within the same session for
 * the denser cadences, and the next day for the once per day cadence and the
 * sparser ones, where "23h" is the longest step that is still due by the next
 * day. The last learning step is the graduating interval, set to the cadence
 * itself for the once per day cadence and the sparser ones, so that cards
 * rated "Took a while"/"Knew right away" return at the selected cadence.
 *
 * The once per day preset also raises the desired retention to 96% and caps
 * the maximum interval at two months, so cards rated successfully a few times
 * are scheduled in days rather than months, and repeated successes grow toward
 * about two months instead of years. The denser cadences and the sparser ones
 * keep the default retention and maximum interval and only change the short
 * learning/relearning steps. The selected cadence itself is stored separately
 * (`srsCadence`) so that the settings can display it.
 */
export const srsCadenceParameters: Record<SrsCadence, { enableShortTerm: boolean, learningSteps: string[], relearningSteps: string[], requestRetention: number, maximumInterval: number }> = {
  [SrsCadence.FOUR_TIMES_A_DAY]: { enableShortTerm: true, learningSteps: ["3h", "1d"], relearningSteps: ["3h"], requestRetention: 0.9, maximumInterval: 36500 },
  [SrsCadence.TWO_TIMES_A_DAY]: { enableShortTerm: true, learningSteps: ["6h", "1d"], relearningSteps: ["6h"], requestRetention: 0.9, maximumInterval: 36500 },
  [SrsCadence.ONCE_PER_DAY]: { enableShortTerm: true, learningSteps: ["23h", "1d"], relearningSteps: ["23h"], requestRetention: 0.96, maximumInterval: 60 },
  [SrsCadence.EVERY_TWO_DAYS]: { enableShortTerm: true, learningSteps: ["23h", "2d"], relearningSteps: ["23h"], requestRetention: 0.9, maximumInterval: 36500 },
  [SrsCadence.EVERY_FOUR_DAYS]: { enableShortTerm: true, learningSteps: ["23h", "4d"], relearningSteps: ["23h"], requestRetention: 0.9, maximumInterval: 36500 },
  [SrsCadence.ONCE_PER_WEEK]: { enableShortTerm: true, learningSteps: ["23h", "7d"], relearningSteps: ["23h"], requestRetention: 0.9, maximumInterval: 36500 }
};
