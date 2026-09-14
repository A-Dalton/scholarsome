import { Rating, State } from "ts-fsrs";
import { SrsRating, SrsState } from "@scholarsome/shared";

// The SRS state columns of the database and the shared `SrsRating`/`SrsState`
// enums mirror the numeric values of the ts-fsrs `Rating`/`State` enums, which
// srs.service.ts relies on when converting between the three. ts-fsrs is the
// source of truth for these values: if an upgrade ever changes them, states
// read from the database would silently be misinterpreted, so the mapping is
// pinned down here.
describe("SRS enum mapping", () => {
  it("SrsRating mirrors the numeric values of the ts-fsrs Rating enum", () => {
    expect(SrsRating.Again).toBe(Rating.Again);
    expect(SrsRating.Hard).toBe(Rating.Hard);
    expect(SrsRating.Good).toBe(Rating.Good);
  });

  it("SrsState mirrors the numeric values of the ts-fsrs State enum", () => {
    expect(SrsState.New).toBe(State.New);
    expect(SrsState.Learning).toBe(State.Learning);
    expect(SrsState.Review).toBe(State.Review);
    expect(SrsState.Relearning).toBe(State.Relearning);
  });
});
