import { ChangeDetectionStrategy, Component, HostListener, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { SrsCard, SrsQueueData, SrsQueueStats, SrsRating, SrsState } from "@scholarsome/shared";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { faBolt, faChevronDown, faChevronUp, faFolder } from "@fortawesome/free-solid-svg-icons";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { SrsService } from "../../shared/http/srs.service";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-srs-review",
  templateUrl: "./srs-review.component.html",
  styleUrls: ["./srs-review.component.scss"],
  imports: [CommonModule, FontAwesomeModule, RouterLink]
})
export class SrsReviewComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly srsService: SrsService,
    private readonly titleService: Title,
    public readonly sanitizer: DomSanitizer
  ) {}

  // ID of the folder to review, or null to review all cards across all folders
  protected folderId: string | null;

  protected readonly SrsRating = SrsRating;
  protected readonly SrsState = SrsState;

  // Data of the review queue, undefined while it is being loaded
  protected queue = signal<SrsQueueData | undefined>(undefined);
  protected stats = signal<SrsQueueStats | undefined>(undefined);

  // Whether the debug statistics are expanded
  protected showStats = signal(true);

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
  // Whether all cards of the session have been rated
  protected completed = signal(false);

  // Amount of cards rated with each rating within the current session
  protected againCount = signal(0);
  protected hardCount = signal(0);
  protected goodCount = signal(0);

  // Amount of unique cards of the session, shown in the completion summary
  protected totalCards = signal(0);

  // Amount of cards learned so far, shown as the counter on the bottom
  protected learnedCount = signal(0);

  // Card IDs that were already rated within the session; only the first
  // rating of a card triggers the SRS and counts towards the summary
  private ratedCardIds = new Set<string>();

  // Cards rated with "Don't know" that are shown once more after 4-12 learned cards
  private pendingReinsertions: { card: SrsCard; remaining: number }[] = [];

  // Delayed text swap of a flip, cancelled when a card is reset beforehand
  private flipTimeout: ReturnType<typeof setTimeout> | undefined;

  protected readonly faQuestionCircle = faQuestionCircle;
  protected readonly faBolt = faBolt;
  protected readonly faFolder = faFolder;
  protected readonly faChevronUp = faChevronUp;
  protected readonly faChevronDown = faChevronDown;

  /**
   * Starts the review session with the given side to answer with
   *
   * @param answer The side of the card the user answers with
   */
  beginReview(answer: "term" | "definition"): void {
    const cards = this.queue()?.cards ?? [];
    if (cards.length === 0) return;

    this.answer.set(answer);

    // the cards are shuffled to show up in random order, mixing all study sets
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    this.cards.set(shuffled);
    this.index.set(0);
    this.completed.set(false);

    this.totalCards.set(cards.length);
    this.learnedCount.set(0);
    this.ratedCardIds.clear();
    this.pendingReinsertions = [];

    this.resetToPromptSide(shuffled[0]);
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
   * Applies the given rating to the current card. Cards rated with "Don't know"
   * disappear and are shown once more after 4-12 cards have been learned in the
   * meantime, repeatedly until they are rated differently. Any other rating
   * completes the card and advances to the next one. Only the first rating of
   * a card within the session triggers the SRS and counts towards the summary
   *
   * @param rating The rating to apply to the current card
   */
  async rate(rating: SrsRating): Promise<void> {
    if (this.ratingInFlight()) return;

    const card = this.cards()[this.index()];
    if (!card) return;

    if (!this.ratedCardIds.has(card.card.id)) {
      this.ratingInFlight.set(true);

      const result = await this.srsService.rate(card.card.id, rating);

      // the state returned by the API is the source of truth for the session
      if (result) {
        card.srs = result.srs;
      }

      this.ratingInFlight.set(false);

      this.ratedCardIds.add(card.card.id);

      if (rating === SrsRating.Again) this.againCount.update((c) => c + 1);
      else if (rating === SrsRating.Hard) this.hardCount.update((c) => c + 1);
      else this.goodCount.update((c) => c + 1);
    }

    if (rating === SrsRating.Again) {
      // the card is shown again after 4-12 cards have been learned in the
      // meantime, woven in between the remaining cards instead of the queue's end
      this.pendingReinsertions.push({ card, remaining: 4 + Math.floor(Math.random() * 9) });
      this.advanceToNextCard();
      return;
    }

    // the learned card advances the countdown of every pending reinsertion
    // and collects the ones that are due now
    this.learnedCount.update((c) => c + 1);

    const due: SrsCard[] = [];
    const stillPending: { card: SrsCard; remaining: number }[] = [];
    for (const pending of this.pendingReinsertions) {
      pending.remaining--;
      if (pending.remaining > 0) stillPending.push(pending);
      else due.push(pending.card);
    }
    this.pendingReinsertions = stillPending;

    if (due.length) {
      this.cards.update((cards) => {
        const copy = [...cards];
        copy.splice(this.index() + 1, 0, ...due);
        return copy;
      });
    }

    this.advanceToNextCard();
  }

  /**
   * Moves on to the next card. Pending reinsertions are flushed to the end of
   * the queue when no cards are left to learn in between, and the session is
   * completed once the last card is reached without pending reinsertions
   */
  private advanceToNextCard(): void {
    if (this.index() === this.cards().length - 1) {
      if (this.pendingReinsertions.length > 0) {
        // no cards are left to learn in between, so the pending cards can
        // only be shown at the end of the queue
        const flushed = this.pendingReinsertions.map((pending) => pending.card);
        this.pendingReinsertions = [];
        this.cards.update((cards) => [...cards, ...flushed]);
      } else {
        // the session is completed
        this.answer.set(undefined);
        this.side.set(undefined);
        this.completed.set(true);
        return;
      }
    }

    this.index.update((i) => i + 1);
    this.resetToPromptSide(this.cards()[this.index()]);
  }

  /**
   * Restarts the review by fetching a fresh queue,
   * returning to the "Answer with" selection
   */
  async restart(): Promise<void> {
    await this.loadQueue();
  }

  /**
   * Loads the review queue. Within a folder it contains all cards scheduled
   * for review within the folder and its subfolders, otherwise it contains
   * all cards scheduled for review across all folders
   */
  private async loadQueue(): Promise<void> {
    const queue = this.folderId ? await this.srsService.queue(this.folderId) : await this.srsService.queueAll();
    if (!queue) {
      await this.router.navigate(["404"]);
      return;
    }

    this.queue.set(queue);
    this.stats.set(queue.stats);

    if (this.folderId) {
      this.titleService.setTitle("Review — Scholarsome");
      if (queue.stats.folder.name) {
        this.titleService.setTitle("Review " + queue.stats.folder.name + " — Scholarsome");
      }
    } else {
      this.titleService.setTitle("Review all — Scholarsome");
    }

    // the session is reset whenever a new queue is loaded
    this.answer.set(undefined);
    this.side.set(undefined);
    this.completed.set(false);
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
    this.pendingReinsertions = [];
  }

  formatDate(date: string | null): string {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-us", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  formatRating(rating: SrsRating): string {
    switch (rating) {
      case SrsRating.Again:
        return "Again";
      case SrsRating.Hard:
        return "Hard";
      case SrsRating.Good:
        return "Good";
      default:
        return "Easy";
    }
  }

  formatState(state: SrsState): string {
    switch (state) {
      case SrsState.New:
        return "New";
      case SrsState.Learning:
        return "Learning";
      case SrsState.Review:
        return "Review";
      case SrsState.Relearning:
        return "Relearning";
      default:
        return "Unknown";
    }
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

    if (event.key === "1") void this.rate(SrsRating.Again);
    else if (event.key === "2") void this.rate(SrsRating.Hard);
    else if (event.key === "3") void this.rate(SrsRating.Good);
  }

  async ngOnInit(): Promise<void> {
    // without a folderId parameter, every card across all folders is reviewed
    this.folderId = this.route.snapshot.paramMap.get("folderId");

    await this.loadQueue();
  }
}
