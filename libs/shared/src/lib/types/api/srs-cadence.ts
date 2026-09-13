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
 * The first learning/relearning step is roughly half of the session gap, so a
 * card rated "Again" resurfaces within the same session, while the "1d" step
 * lets cards rated "Hard"/"Good" graduate to the next day. Cadences sparser
 * than once per day share the parameters of the once per day preset, which is
 * why the selected cadence itself is stored separately (`srsCadence`).
 *
 * `srsRequestRetention`, `srsMaximumInterval`, `srsW` and `srsEnableFuzz` are
 * not affected by the cadence and keep their stored values.
 */
export const srsCadenceParameters: Record<SrsCadence, { enableShortTerm: boolean, learningSteps: string[], relearningSteps: string[] }> = {
  [SrsCadence.FOUR_TIMES_A_DAY]: { enableShortTerm: true, learningSteps: ["3h", "1d"], relearningSteps: ["3h"] },
  [SrsCadence.TWO_TIMES_A_DAY]: { enableShortTerm: true, learningSteps: ["6h", "1d"], relearningSteps: ["6h"] },
  [SrsCadence.ONCE_PER_DAY]: { enableShortTerm: false, learningSteps: ["1d"], relearningSteps: ["1d"] },
  [SrsCadence.EVERY_TWO_DAYS]: { enableShortTerm: false, learningSteps: ["1d"], relearningSteps: ["1d"] },
  [SrsCadence.EVERY_FOUR_DAYS]: { enableShortTerm: false, learningSteps: ["1d"], relearningSteps: ["1d"] },
  [SrsCadence.ONCE_PER_WEEK]: { enableShortTerm: false, learningSteps: ["1d"], relearningSteps: ["1d"] }
};
