import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { BsModalService } from "ngx-bootstrap/modal";
import { SrsCardReviewInfo, SrsState } from "@scholarsome/shared";
import { CardReviewInfoComponent } from "./card-review-info.component";

describe("CardReviewInfoComponent", () => {
  // A reviewed card whose dominant rating can be shaped through the overrides
  const reviewed: SrsCardReviewInfo = {
    cardId: "card-1",
    due: null,
    state: SrsState.Review,
    lapses: 0,
    lastReview: null,
    totalReviews: 4,
    againCount: 0,
    hardCount: 0,
    goodCount: 4,
    history: []
  };

  function render(info: SrsCardReviewInfo | null) {
    const fixture = TestBed.createComponent(CardReviewInfoComponent);
    fixture.componentRef.setInput("info", info);
    fixture.detectChanges();
    return fixture;
  }

  function dominantClass(overrides: Partial<SrsCardReviewInfo>): string | null {
    const fixture = render({ ...reviewed, ...overrides });
    const button = fixture.nativeElement.querySelector(".review-info-button") as HTMLElement;
    return ["again", "hard", "good"].find((rating) => button.classList.contains(rating)) ?? null;
  }

  beforeEach(() => {
    // the match media API is not implemented by the test browser and is only
    // read once to decide between the popover and the modal of the icon
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });

    TestBed.configureTestingModule({
      providers: [{ provide: BsModalService, useValue: {} as BsModalService }, provideZonelessChangeDetection()]
    });
  });

  // review information is absent entirely, e.g. while it is being loaded or
  // for users that are not the author of the set; cards that have not been
  // reviewed yet still get the icon with its standard color, as covered below
  it("renders no icon when review information is not provided", () => {
    const fixture = render(null);

    expect(fixture.nativeElement.querySelector(".review-info-button")).toBeNull();
  });

  it("colors the icon by the rating with the highest amount of reviews", () => {
    expect(dominantClass({ goodCount: 4 })).toBe("good");
    expect(dominantClass({ hardCount: 3, goodCount: 1 })).toBe("hard");
    expect(dominantClass({ againCount: 2, hardCount: 1, goodCount: 1 })).toBe("again");

    // ties are broken towards the worse rating
    expect(dominantClass({ againCount: 2, goodCount: 2 })).toBe("again");
    expect(dominantClass({ hardCount: 2, goodCount: 2 })).toBe("hard");
  });

  it("keeps the standard icon color for cards that have not been reviewed yet", () => {
    expect(dominantClass({ totalReviews: 0, againCount: 0, hardCount: 0, goodCount: 0 })).toBeNull();
  });
});
