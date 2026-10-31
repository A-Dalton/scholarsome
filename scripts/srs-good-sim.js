const fsrs = require("ts-fsrs");
const { fsrs: FSRS, createEmptyCard, Rating, State, StrategyMode, ConvertStepUnitToMinutes } = fsrs;

function customLearning(params, state, curStep) {
  const steps = state === State.Relearning || state === State.Review ? params.relearning_steps : params.learning_steps;
  if (steps.length === 0 || curStep >= steps.length) return {};
  const toMin = ConvertStepUnitToMinutes;
  const result = {};
  if (state === State.Review) {
    result[Rating.Again] = { scheduled_minutes: toMin(steps[0]), next_step: 0 };
    return result;
  }
  result[Rating.Again] = { scheduled_minutes: toMin(steps[0]), next_step: 0 };
  if (steps.length === 1) {
    result[Rating.Hard] = { scheduled_minutes: Math.round(toMin(steps[0]) * 1.5), next_step: 0 };
    return result;
  }
  const nextStep = curStep + 1;
  if (nextStep < steps.length) {
    const cur = toMin(steps[curStep]);
    const next = toMin(steps[nextStep]);
    result[Rating.Hard] = { scheduled_minutes: Math.round((cur + next) / 2), next_step: nextStep };
    result[Rating.Good] = { scheduled_minutes: next, next_step: nextStep };
  } else {
    result[Rating.Hard] = { scheduled_minutes: 0, next_step: steps.length };
    result[Rating.Good] = { scheduled_minutes: 0, next_step: steps.length };
  }
  return result;
}

const ONE = fsrs.generatorParameters({ enable_short_term: true, learning_steps: ["23h", "1d"], relearning_steps: ["23h"], request_retention: 0.9 });

function make() {
  const s = FSRS(ONE);
  s.useStrategy(StrategyMode.LEARNING_STEPS, customLearning);
  return s;
}

function sim(history) {
  let card = createEmptyCard(new Date("2026-10-01T00:00:00Z"));
  let t = new Date("2026-10-01T00:00:00Z");
  const s = make();
  history.forEach((rating, i) => {
    if (i > 0) t = new Date(card.due.getTime());
    const r = s.next(card, t, rating);
    card = r.card;
    console.log(i + 1, rating === 1 ? "Again" : rating === 2 ? "Hard" : "Good",
      "state", card.state, "steps", card.learning_steps,
      "review", t.toISOString(), "due", card.due.toISOString(),
      "schedDays", card.scheduled_days, "stab", card.stability.toFixed(3),
      "diffDays", (card.due - t) / 86400000);
  });
}

console.log("=== 2 Good + 1 Hard ===");
sim([3, 3, 2]);
console.log("=== 3 Good ===");
sim([3, 3, 3]);
console.log("=== 3 Good + 1 Hard ===");
sim([3, 3, 3, 2]);
console.log("=== 6 Good ===");
sim([3, 3, 3, 3, 3, 3]);
