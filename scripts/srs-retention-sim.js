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

function sim(history, retention) {
  const p = fsrs.generatorParameters({ enable_short_term: true, learning_steps: ["23h", "1d"], relearning_steps: ["23h"], request_retention: retention });
  const s = FSRS(p);
  s.useStrategy(StrategyMode.LEARNING_STEPS, customLearning);
  let card = createEmptyCard(new Date("2026-10-01T00:00:00Z"));
  let t = new Date("2026-10-01T00:00:00Z");
  const out = [];
  history.forEach((rating, i) => {
    if (i > 0) t = new Date(card.due.getTime());
    const r = s.next(card, t, rating);
    card = r.card;
    out.push({ i: i + 1, rating, state: card.state, steps: card.learning_steps, dueDays: (card.due - t) / 86400000, stab: card.stability });
  });
  console.log("retention", retention);
  out.forEach((o) => console.log(o.i, o.rating === 1 ? "Again" : o.rating === 2 ? "Hard" : "Good", o.state, o.steps, "dueDays", o.dueDays.toFixed(1), "stab", o.stab.toFixed(2)));
  console.log();
}

for (const r of [0.9, 0.95, 0.97, 0.98]) {
  sim([3, 3, 2], r);
  sim([3, 3, 3, 3, 3, 3], r);
}
