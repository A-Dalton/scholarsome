import { ChangeDetectionStrategy, Component, HostListener, OnInit, ViewChild, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { SrsCard, SrsQueueData, SrsRating, SrsState } from "@scholarsome/shared";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { faBolt, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { SrsService } from "../shared/http/srs.service";
import { FoldersService } from "../shared/http/folders.service";
import { SetsService } from "../shared/http/sets.service";
import { CardMistakesService } from "../shared/http/card-mistakes.service";
import { AlertComponent } from "../shared/alert/alert.component";
import { FlashcardControlAction, FlashcardControlsComponent } from "../shared/flashcard-controls/flashcard-controls.component";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-srs-review",
  templateUrl: "./srs-review.component.html",
  styleUrls: ["./srs-review.component.scss"],
  imports: [CommonModule, FontAwesomeModule, RouterLink, FlashcardControlsComponent, TooltipModule, AlertComponent]
})
export class SrsReviewComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly srsService: SrsService,
    private readonly foldersService: FoldersService,
    private readonly setsService: SetsService,
    private readonly cardMistakesService: CardMistakesService,
    private readonly titleService: Title,
    public readonly sanitizer: DomSanitizer
  ) {}

  // Controls of the lower card, referenced to flash the rating buttons when
  // an action is triggered with the keyboard
  @ViewChild(FlashcardControlsComponent) private controls?: FlashcardControlsComponent;

  // ID of the folder to review, or null when another scope is reviewed
  protected folderId: string | null;

  // ID of the study set to review, or null when another scope is reviewed
  protected setId: string | null;

  protected readonly SrsRating = SrsRating;
  protected readonly SrsState = SrsState;

  // Data of the review queue, undefined while it is being loaded
  protected queue = signal<SrsQueueData | undefined>(undefined);

  // What the user answers with, undefined while the session has not begun
  protected answer = signal<"term" | "definition" | undefined>(undefined);

  // The cards scheduled for review
  protected cards = signal<SrsCard[]>([]);
  // The current index within the cards
  protected index = signal(0);

  // The current side being shown
  protected side = signal<"term" | "definition" | undefined>(undefined);
  // The text being shown to the user
  protected sideText = signal("");

  // Whether the card has been flipped or not
  protected flipped = signal(false);
  // Whether the first flip interaction has been made
  // needed to prevent animation classes from being applied until first click
  protected flipInteraction = signal(false);

  // Whether a rating request is currently in flight
  protected ratingInFlight = signal(false);
  // Whether the busy state of a rating is shown; only activated when a rating
  // takes longer than the delay, so that fast ratings do not flash the UI
  protected ratingBusy = signal(false);
  // Whether all cards of the session have been rated
  protected completed = signal(false);

  // Whether the last rating could not be saved and the session was aborted;
  // shown on the start screen, from which the review can be started again
  protected ratingFailed = signal(false);

  // Amount of cards rated with each rating within the current session
  protected againCount = signal(0);
  protected hardCount = signal(0);
  protected goodCount = signal(0);

  // Amount of unique cards of the session, shown in the completion summary
  protected totalCards = signal(0);

  // Amount of cards rated so far, shown as the counter on the bottom; a card
  // re-shown as a previous mistake is not counted again when it is moved past
  protected learnedCount = signal(0);

  // Card IDs that were already rated within the session. Only the first
  // rating of a card triggers the SRS and counts towards the summary; cards
  // that are shown again after their "Don't know" are only moved past
  private ratedCardIds = new Set<string>();

  // Delayed text swap of a flip, cancelled when a card is reset beforehand
  private flipTimeout: ReturnType<typeof setTimeout> | undefined;

  // Time until the busy state of a rating is shown
  private readonly ratingBusyDelay = 200;

  // Delayed activation of the busy state of a rating, cancelled when the
  // rating resolves before the delay has elapsed
  private ratingBusyTimeout: ReturnType<typeof setTimeout> | undefined;

  protected readonly faQuestionCircle = faQuestionCircle;
  protected readonly faBolt = faBolt;
  protected readonly faCircleInfo = faCircleInfo;

  // The states that the scheduled cards are counted by on the start screen,
  // with the label of each box and the explanation that its info icon shows
  // when hovered
  protected readonly stateTiles: { state: SrsState; label: string; info: string }[] = [
    {
      state: SrsState.New,
      label: "New",
      info: "Cards you have never reviewed before."
    },
    {
      state: SrsState.Learning,
      label: "Learning",
      info: "Cards you are still learning and trying to memorize."
    },
    {
      state: SrsState.Review,
      label: "Reviewing",
      info: "Cards you have learned and still review from time to time."
    },
    {
      state: SrsState.Relearning,
      label: "Relearning",
      info: "Cards you have learned before, but forgot during a review."
    }
  ];

  /**
   * Starts the review session with the given side to answer with
   *
   * @param answer The side of the card the user answers with
   */
  beginReview(answer: "term" | "definition"): void {
    const cards = this.queue()?.cards ?? [];
    if (cards.length === 0) return;

    this.answer.set(answer);

    // the session follows the order of the queue: new cards first, then by
    // due date, so that a session that was stopped in the middle continues
    // with the same order on the next attempt
    this.cards.set([...cards]);
    this.index.set(0);
    this.completed.set(false);

    this.totalCards.set(cards.length);
    this.learnedCount.set(0);
    this.ratedCardIds.clear();

    this.resetToPromptSide(this.cards()[0]);
  }

  /**
   * Buttons of the lower card, rating the current card within the SRS
   */
  protected getRatingActions(): FlashcardControlAction[] {
    // the card was already rated within the session and is shown again after
    // its "Don't know": its rating is already scheduled on the server, so
    // instead of the rating buttons it is only moved past
    if (this.isReinsertedCard()) {
      return [
        {
          label: "Continue",
          variant: "btn-outline-secondary",
          ariaLabel: "Continue",
          disabled: this.ratingBusy(),
          action: () => this.completeReinsertedCard()
        }
      ];
    }

    return [
      {
        label: "Don't know",
        variant: "btn-outline-danger",
        key: "1",
        ariaLabel: "Don't know (press 1)",
        disabled: this.ratingBusy(),
        action: () => void this.rate(SrsRating.Again)
      },
      {
        label: "Took a while",
        variant: "btn-outline-warning",
        key: "2",
        ariaLabel: "Took a while (press 2)",
        disabled: this.ratingBusy(),
        action: () => void this.rate(SrsRating.Hard)
      },
      {
        label: "Got it",
        variant: "btn-outline-success",
        key: "3",
        ariaLabel: "Got it (press 3)",
        disabled: this.ratingBusy(),
        action: () => void this.rate(SrsRating.Good)
      }
    ];
  }

  /**
   * Amount of cards scheduled for review with the given state
   *
   * @param state The state of the cards to count
   */
  scheduledStateCount(state: SrsState): number {
    return this.queue()?.cards.filter((card) => card.srs.state === state).length ?? 0;
  }

  /**
   * Flips the currently shown card
   */
  flipCard(): void {
    if (!this.answer() || this.ratingInFlight()) return;

    this.flipInteraction.set(true);
    this.flipped.update((v) => !v);

    // delayed to occur when text is the least visible during animation
    this.flipTimeout = setTimeout(() => {
      this.flipTimeout = undefined;

      const card = this.cards()[this.index()]?.card;
      if (!card) return;

      if (this.side() === "term") {
        this.sideText.set(card.definition);
        this.side.set("definition");
      } else {
        this.sideText.set(card.term);
        this.side.set("term");
      }
    }, 150);
  }

  /**
   * Resets the current card to its prompt side, e.g. when moving on to the
   * next card or when showing the same card again after a "Don't know"
   *
   * @param card The card to show the prompt side of
   */
  private resetToPromptSide(card: SrsCard): void {
    if (this.flipTimeout) {
      clearTimeout(this.flipTimeout);
      this.flipTimeout = undefined;
    }

    this.flipInteraction.set(false);
    this.flipped.set(false);

    // the prompt is the opposite side of what the user answers with
    this.side.set(this.answer() === "definition" ? "term" : "definition");
    this.sideText.set(card.card[this.side() as "term" | "definition"]);
  }

  /**
   * Cancels the busy state of a rating: when its delayed activation is still
   * pending, it is discarded so that the state is never shown at all, and when
   * the busy state is already shown, it is hidden again
   */
  private cancelRatingBusy(): void {
    if (this.ratingBusyTimeout) {
      clearTimeout(this.ratingBusyTimeout);
      this.ratingBusyTimeout = undefined;
    } else {
      this.ratingBusy.set(false);
    }
  }

  /**
   * Applies the given rating to the current card. Cards rated with "Don't know"
   * are woven back into the remaining queue and are shown once more after 4-12
   * cards have been passed in the meantime, marked as a previous mistake. They
   * rating was already scheduled by the "Don't know", so they are only moved
   * past with completeReinsertedCard. Any other rating completes the card and
   * advances to the next one
   *
   * @param rating The rating to apply to the current card
   */
  async rate(rating: SrsRating): Promise<void> {
    if (this.ratingInFlight()) return;

    const card = this.cards()[this.index()];
    if (!card) return;

    // the card was already rated within the session and is only shown again
    // after its "Don't know": its rating is already scheduled on the server,
    // so it is neither rated again nor shown a third time
    if (this.ratedCardIds.has(card.card.id)) return;

    this.ratingInFlight.set(true);

    // the busy state is only shown when the rating takes longer than the
    // delay, so that fast ratings do not flash the interface
    this.ratingBusyTimeout = setTimeout(() => {
      this.ratingBusyTimeout = undefined;
      this.ratingBusy.set(true);
    }, this.ratingBusyDelay);

    const result = await this.srsService.rate(card.card.id, rating);

    this.cancelRatingBusy();
    this.ratingInFlight.set(false);

    // the rating was not persisted, e.g. because the connection was lost.
    // The session is quit instead of continuing with a client state that
    // no longer matches the schedule on the server
    if (!result) {
      await this.abortSession();
      return;
    }

    // the state returned by the API is the source of truth for the session
    card.srs = result.srs;

    this.ratedCardIds.add(card.card.id);

    if (rating === SrsRating.Again) {
      this.againCount.update((c) => c + 1);

      // the card is stored as a previous mistake, like the "Don't know"
      // button of progressive flashcards; it is recorded exactly once per
      // session, as the card cannot be rated again within it
      void this.cardMistakesService.createMistake(card.card.id);

      // the card is woven back into the remaining queue, so that it is shown
      // again after 4-12 cards instead of leaving the session right away
      this.weaveInMistake(card);
    } else if (rating === SrsRating.Hard) this.hardCount.update((c) => c + 1);
    else this.goodCount.update((c) => c + 1);

    // every first rating counts the card as learned, including a "Don't know":
    // the card was dealt with and comes back only as a previous mistake
    this.learnedCount.update((c) => c + 1);

    this.advanceToNextCard();
  }

  /**
   * Weaves a card rated with "Don't know" back into the remaining queue, so
   * that it is shown again after 4-12 cards have been passed in the meantime.
   * The position is drawn at random and kept away from the mistakes that are
   * woven in already, so that several mistakes do not come back one after
   * another. When the queue ends before the drawn distance, the card is shown
   * at its end
   *
   * @param card The card rated with "Don't know" to show again
   */
  private weaveInMistake(card: SrsCard): void {
    this.cards.update((cards) => {
      const copy = [...cards];

      let position = copy.length;
      for (let attempt = 0; attempt < 10; attempt++) {
        const distance = 4 + Math.floor(Math.random() * 9);
        position = Math.min(this.index() + 1 + distance, copy.length);

        // the card must not be placed right next to a mistake that comes back
        // later as well; when no free spot is drawn after several attempts,
        // the last drawn position is used as a fallback
        const before = copy[position - 1];
        const after = copy[position];
        if (
          (!before || !this.ratedCardIds.has(before.card.id)) &&
          (!after || !this.ratedCardIds.has(after.card.id))
        ) {
          break;
        }
      }

      copy.splice(position, 0, card);
      return copy;
    });
  }

  /**
   * Whether the currently shown card was already rated within the session and
   * is only shown again after its "Don't know"
   */
  protected isReinsertedCard(): boolean {
    const card = this.cards()[this.index()];
    return !!card && this.ratedCardIds.has(card.card.id);
  }

  /**
   * Moves past the currently shown reinserted card. The card was already rated
   * within the session and its "Don't know" is already scheduled on the
   * server, so it is neither rated again nor shown a third time: it simply
   * leaves the queue, without counting towards the learned counter again
   */
  private completeReinsertedCard(): void {
    if (this.ratingInFlight()) return;

    const card = this.cards()[this.index()];
    if (!card || !this.ratedCardIds.has(card.card.id)) return;

    this.advanceToNextCard();
  }

  /**
   * Moves on to the next card and completes the session once the last one is
   * reached. Cards rated with "Don't know" are woven back into the queue when
   * they are rated, so every card that is still to be shown is already part
   * of it
   */
  private advanceToNextCard(): void {
    if (this.index() === this.cards().length - 1) {
      // the session is completed
      this.answer.set(undefined);
      this.side.set(undefined);
      this.completed.set(true);
      return;
    }

    this.index.update((i) => i + 1);
    this.resetToPromptSide(this.cards()[this.index()]);
  }

  /**
   * Restarts the review by fetching a fresh queue,
   * returning to the "Answer with" selection
   */
  async restart(): Promise<void> {
    // a rating is in flight: the session must not be torn down before the
    // API answered, as its response would apply to the reset session
    if (this.ratingInFlight()) return;

    await this.loadQueue();
  }

  /**
   * Quits the session because a rating could not be saved. The session is
   * reset to the start screen and the queue is reloaded, so that its counts
   * match the schedule on the server again. When the queue cannot be reached,
   * the stale one is kept: the error on the start screen explains the aborted
   * session and navigating away would hide it
   */
  private async abortSession(): Promise<void> {
    this.resetSession();
    this.ratingFailed.set(true);

    const queue = await this.fetchQueue();
    if (queue) this.queue.set(queue);
  }

  /**
   * Loads the review queue. Within a set it contains all cards scheduled for
   * review within the set, within a folder it contains all cards scheduled
   * for review within the folder and its subfolders, otherwise it contains
   * all cards scheduled for review across all folders
   */
  private async loadQueue(): Promise<void> {
    const queue = await this.fetchQueue();

    if (!queue) {
      await this.router.navigate(["404"]);
      return;
    }

    this.queue.set(queue);

    if (this.setId) {
      const set = await this.setsService.set(this.setId);
      this.titleService.setTitle((set ? "Review " + set.title : "Review") + " — Scholarsome");
    } else if (this.folderId) {
      const folder = await this.foldersService.folder(this.folderId);
      this.titleService.setTitle((folder ? "Review " + folder.name : "Review") + " — Scholarsome");
    } else {
      this.titleService.setTitle("Review all — Scholarsome");
    }

    // the session is reset whenever a new queue is loaded
    this.resetSession();
  }

  /**
   * Fetches the review queue of the current scope without any further
   * processing, so that it can be used by both the initial load and the
   * reload after an aborted session
   *
   * @returns `SrsQueueData` object, or null when it could not be loaded
   */
  private async fetchQueue(): Promise<SrsQueueData | null> {
    if (this.setId) return this.srsService.setQueue(this.setId);
    if (this.folderId) return this.srsService.queue(this.folderId);
    return this.srsService.queueAll();
  }

  /**
   * Resets the state of a session, e.g. when a new queue is loaded or when
   * the session is aborted because a rating failed
   */
  private resetSession(): void {
    if (this.flipTimeout) {
      clearTimeout(this.flipTimeout);
      this.flipTimeout = undefined;
    }

    this.cancelRatingBusy();

    this.answer.set(undefined);
    this.side.set(undefined);
    this.completed.set(false);
    this.ratingFailed.set(false);
    this.cards.set([]);
    this.index.set(0);
    this.flipped.set(false);
    this.flipInteraction.set(false);
    this.againCount.set(0);
    this.hardCount.set(0);
    this.goodCount.set(0);
    this.totalCards.set(0);
    this.learnedCount.set(0);
    this.ratedCardIds.clear();
  }

  @HostListener("document:keypress", ["$event"])
  keyboardSpaceEvent(event: KeyboardEvent) {
    if (this.answer() && event.key === " ") {
      event.preventDefault();
      this.flipCard();
    }
  }

  @HostListener("document:keydown", ["$event"])
  keyboardRatingEvent(event: KeyboardEvent) {
    if (!this.answer() || this.ratingInFlight()) return;

    // the shown card was already rated within the session and is only shown
    // again after its "Don't know": every rating key just moves past it, as
    // its rating is already scheduled on the server
    if (this.isReinsertedCard()) {
      if (event.key === "1" || event.key === "2" || event.key === "3") {
        this.controls?.flashAction(0);
        this.completeReinsertedCard();
      }
      return;
    }

    if (event.key === "1") {
      this.controls?.flashAction(0);
      void this.rate(SrsRating.Again);
    } else if (event.key === "2") {
      this.controls?.flashAction(1);
      void this.rate(SrsRating.Hard);
    } else if (event.key === "3") {
      this.controls?.flashAction(2);
      void this.rate(SrsRating.Good);
    }
  }

  async ngOnInit(): Promise<void> {
    // without a folderId or setId parameter, every card across all folders is reviewed
    this.folderId = this.route.snapshot.paramMap.get("folderId");
    this.setId = this.route.snapshot.paramMap.get("setId");

    await this.loadQueue();
  }
}
