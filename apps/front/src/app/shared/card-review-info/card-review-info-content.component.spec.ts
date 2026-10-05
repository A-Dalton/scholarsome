import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SrsCardReviewInfo, SrsRating, SrsState } from "@scholarsome/shared";
import { CardReviewInfoContentComponent } from "./card-review-info-content.component";

describe("CardReviewInfoContentComponent", () => {
  // Due in three days so that the due pill shows a relative date regardless
  // of when the suite runs
  const dueSoon: SrsCardReviewInfo = {
    cardId: "card-1",
    due: new Date(Date.now() + 3 * 86400000).toISOString(),
    state: SrsState.Review,
    lapses: 1,
    lastReview: "2026-09-08T12:30:00.000Z",
    totalReviews: 4,
    againCount: 1,
    hardCount: 1,
    goodCount: 2,
    history: [
      {
        rating: SrsRating.Again,
        state: SrsState.Learning,
        review: "2026-09-01T12:30:00.000Z",
        due: "2026-09-01T12:30:00.000Z",
        scheduledDays: 0
      },
      {
        rating: SrsRating.Good,
        state: SrsState.Review,
        review: "2026-09-08T12:30:00.000Z",
        due: "2026-09-22T12:30:00.000Z",
        scheduledDays: 14
      }
    ]
  };

  // A card that has never been reviewed, as returned for every card of a set
  const newCard: SrsCardReviewInfo = {
    cardId: "card-2",
    due: null,
    state: SrsState.New,
    lapses: 0,
    lastReview: null,
    totalReviews: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    history: []
  };

  function render(info: SrsCardReviewInfo | null) {
    const fixture = TestBed.createComponent(CardReviewInfoContentComponent);
    fixture.componentRef.setInput("info", info);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
  });

  it("renders nothing when the card has not been reviewed yet", () => {
    const fixture = render(null);

    expect(fixture.nativeElement.textContent.trim()).toBe("");
  });

  it("shows when the card is due next", () => {
    const fixture = render(dueSoon);

    const pill = fixture.nativeElement.querySelector(".due-pill") as HTMLElement | null;

    expect(pill?.textContent).toContain("Due in 3 days");
  });

  it("shows a card that is due as due now", () => {
    const fixture = render({ ...dueSoon, due: new Date(Date.now() - 3600000).toISOString() });

    const pill = fixture.nativeElement.querySelector(".due-pill") as HTMLElement | null;

    expect(pill?.textContent).toContain("Due now");
  });

  it("shows a card that was never scheduled as not scheduled", () => {
    const fixture = render({ ...dueSoon, due: null });

    const pill = fixture.nativeElement.querySelector(".due-pill") as HTMLElement | null;

    expect(pill?.textContent).toContain("Not scheduled");
  });

  it("shows a card that has never been reviewed as new", () => {
    const fixture = render(newCard);

    const pill = fixture.nativeElement.querySelector(".due-pill") as HTMLElement | null;

    expect(pill?.textContent).toContain("New");
    expect(pill?.classList.contains("due-new")).toBe(true);

    const due = fixture.nativeElement.querySelector(".review-info-due") as HTMLElement | null;
    expect(due?.textContent).toContain("This card has not been reviewed yet");

    const empty = Array.from(fixture.nativeElement.querySelectorAll(".review-info-empty")) as HTMLElement[];
    expect(empty.map((element) => (element.textContent ?? "").trim())).toEqual(["No ratings yet", "No reviews recorded yet"]);

    const stats = Array.from(fixture.nativeElement.querySelectorAll(".review-stat")) as HTMLElement[];
    expect(stats.map((stat) =>
      Array.from(stat.querySelectorAll(".review-stat-value, .review-stat-label"))
        .map((part) => (part.textContent ?? "").trim())
        .join(" ")
    )).toEqual([
      "New State",
      "0 Reviews",
      "0 Lapses",
      "- Retention"
    ]);
  });

  it("shows the amount and percentage of each rating within the legend", () => {
    const fixture = render(dueSoon);

    const counts = Array.from(fixture.nativeElement.querySelectorAll(".legend-count")) as HTMLElement[];
    const percents = Array.from(fixture.nativeElement.querySelectorAll(".legend-percent")) as HTMLElement[];

    expect(counts.map((count) => (count.textContent ?? "").trim())).toEqual(["1×", "1×", "2×"]);
    expect(percents.map((percent) => (percent.textContent ?? "").trim())).toEqual(["25%", "25%", "50%"]);
  });

  it("shows one bar per review with the rating and schedule of the review as tooltip", () => {
    const fixture = render(dueSoon);

    const bars = Array.from(fixture.nativeElement.querySelectorAll(".history-bar")) as HTMLElement[];

    expect(bars).toHaveLength(2);
    expect(bars[0].title).toContain("Don't know");
    expect(bars[0].title).toContain("back right away");
    expect(bars[1].title).toContain("Got it");
    expect(bars[1].title).toContain("back in 14 days");
  });

  it("notes when only a part of the reviews is shown", () => {
    const fixture = render(dueSoon);

    const capped = fixture.nativeElement.querySelector(".history-capped") as HTMLElement | null;

    expect(capped?.textContent).toContain("last 2 of 4");
  });

  it("shows the state, reviews, lapses and retention of the card", () => {
    const fixture = render(dueSoon);

    const stats = Array.from(fixture.nativeElement.querySelectorAll(".review-stat")) as HTMLElement[];

    expect(stats.map((stat) =>
      Array.from(stat.querySelectorAll(".review-stat-value, .review-stat-label"))
        .map((part) => (part.textContent ?? "").trim())
        .join(" ")
    )).toEqual([
      "Review State",
      "4 Reviews",
      "1 Lapses",
      "75% Retention"
    ]);
  });
});
