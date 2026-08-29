import { ChangeDetectionStrategy, Component, HostListener, OnInit, TemplateRef, ViewChild, signal } from "@angular/core";
import { SetsService } from "../../shared/http/sets.service";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Card } from "@scholarsome/prisma";
import { BsModalRef } from "ngx-bootstrap/modal";
import { faThumbsUp, faCake } from "@fortawesome/free-solid-svg-icons";
import { DomSanitizer, Meta, Title } from "@angular/platform-browser";
import { NgForm, FormsModule } from "@angular/forms";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { CardMistakesService } from "../../shared/http/card-mistakes.service";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-study-set-flashcards",
  templateUrl: "./study-set-flashcards.component.html",
  styleUrls: ["./study-set-flashcards.component.scss"],
  imports: [CommonModule, FormsModule, FontAwesomeModule, RouterLink]
})
export class StudySetFlashcardsComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly sets: SetsService,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    public readonly sanitizer: DomSanitizer,
    private readonly cardMistakesService: CardMistakesService
  ) {}

  @ViewChild("flashcardsConfig") configModal: TemplateRef<HTMLElement>;
  @ViewChild("completedRound") roundCompletedModal: TemplateRef<HTMLElement>;

  protected cards: Card[];
  protected setId: string | null;

  protected flashcardsMode: "traditional" | "progressive";
  protected shufflingEnabled = false;

  // Array of the IDs of known cards for progressive mode
  protected knownCardIDs: string[] = [];
  // IDs of cards already stored as mistakes in the current session, so that
  // cards resurfacing in later rounds are not stored again until a new session
  protected sessionMistakeIDs = new Set<string>();
  // Whether the user is between rounds
  protected roundCompleted = false;
  // Counter for number of cards learned in the current round
  protected newLearnedCards = 0;

  // What the user answers with
  protected answer: "definition" | "term";
  // The current index
  protected index = 0;
  // The current card
  protected currentCard: Card;

  // The current side being shown
  protected side: string;
  // The text being shown to the user
  protected sideText = signal("");
  // Displayed in bottom right showing the progress
  protected remainingCards = signal("");

  // Whether the card has been flipped or not
  protected flipped = false;
  // Whether the first flip interaction has been made
  // needed to prevent animation classes from being applied until first click
  protected flipInteraction = false;

  protected modalRef?: BsModalRef;
  protected readonly faThumbsUp = faThumbsUp;
  protected readonly faCake = faCake;
  protected readonly faQuestionCircle = faQuestionCircle;

  @HostListener("document:keypress", ["$event"])
  keyboardSpaceEvent(event: KeyboardEvent) {
    if (
      this.flashcardsMode &&
      !this.roundCompleted &&
      event.key === " "
    ) {
      this.flipCard();
    }
  }

  @HostListener("document:keyup", ["$event"])
  keyboardArrowEvent(event: KeyboardEvent) {
    if (
      this.flashcardsMode &&
      !this.roundCompleted
    ) {
      if (event.key === "ArrowLeft") {
        if (this.flashcardsMode === "traditional") {
          this.changeCard(-1);
        } else {
          this.changeCard(1);
        }
      } else if (event.key === "ArrowRight") {
        if (this.flashcardsMode === "traditional") {
          this.changeCard(1);
        } else {
          this.incrementLearntCount();
          this.knownCardIDs.push(this.currentCard.id);
          this.changeCard(1);
        }
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        this.flipCard();
      }
    }
  }

  updateIndex() {
    this.remainingCards.set(`${this.index + 1}/${this.cards.length}`);
  }

  incrementLearntCount(): void {
    this.newLearnedCards++;
  }

  // On touch devices, briefly fill the answer button's background (like a mouse
  // hover would) then let it return to neutral, since sticky :hover would
  // otherwise persist the color.
  flashButton(event: Event): void {
    // Only do this on devices without a real hover (touch / coarse pointer)
    if (!window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const button = event.currentTarget as HTMLButtonElement;
    // Restart the one-shot animation on every tap so it re-fills each time
    button.classList.remove("flash-bg");
    void button.offsetWidth;
    button.classList.add("flash-bg");
  }

  // Stores the current card as a mistake for progressive mode's "Don't know" option.
  // Only stored the first time it is marked in a session; if it is presented
  // again in a later round it is skipped until a new session begins
  async markAsMistake(): Promise<void> {
    if (this.flashcardsMode !== "progressive" || !this.currentCard) return;

    // capture the id before awaiting: changeCard() advances currentCard while
    // the request is still in flight
    const cardId = this.currentCard.id;
    if (this.sessionMistakeIDs.has(cardId)) return;

    // remember it right away so an in-flight request is never sent twice
    this.sessionMistakeIDs.add(cardId);

    const mistake = await this.cardMistakesService.createMistake(cardId);

    // allow a retry in a later round if storing failed
    if (!mistake) this.sessionMistakeIDs.delete(cardId);
  }

  flipCard(type?: string) {
    if (!type) {
      this.flipInteraction = true;
      this.flipped = !this.flipped;
    }

    // delayed to occur when text is the least visible during animation
    setTimeout(() => {
      if (this.side === "term") {
        this.sideText.set(this.cards[this.index].definition);
        this.side = "definition";
      } else {
        this.sideText.set(this.cards[this.index].term);
        this.side = "term";
      }
    }, 150);
  }

  changeCard(direction: number) {
    if (
      this.index === 0 &&
      direction === -1
    ) return;

    if (
      this.index === this.cards.length - 1 &&
      direction === 1 &&
      this.flashcardsMode === "traditional"
    ) return;

    // increment the currentCard object to the next card in the array
    if (this.flashcardsMode === "progressive" && this.index !== this.cards.length - 1) {
      this.currentCard = this.cards[this.index + 1];
    }

    // runs after a progressive mode round has completed
    if (this.index === this.cards.length - 1 && this.flashcardsMode === "progressive") {
      // remove any cards that are known
      this.cards = this.cards.filter((c) => !this.knownCardIDs.includes(c.id));

      this.roundCompleted = true;

      // if the entire mode is not completed
      if (this.cards.length > 0) {
        this.index = 0;
        this.updateIndex();

        if (this.shufflingEnabled) this.cards = this.cards.sort(() => 0.5 - Math.random());

        // reset the side to the prompt side for the next round
        this.side = this.answer === "definition" ? "term" : "definition";
        this.sideText.set(this.cards[0][this.side as keyof Card] as string);
      }

      this.flipped = false;
      this.flipInteraction = false;
      this.currentCard = this.cards[0];

      return;
    }

    this.index += direction;
    this.updateIndex();

    this.flipInteraction = false;
    this.flipped = false;

    if (this.answer === "definition") {
      this.side = "term";
    } else {
      this.side = "definition";
    }

    this.sideText.set(
      this.answer === "definition" ? this.cards[this.index].term : this.cards[this.index].definition
    );
  }

  beginFlashcards(form: NgForm) {
    this.flashcardsMode = form.value["flashcards-type"];
    this.answer = form.value["answer-with"];
    this.side = form.value["answer-with"] === "definition" ? "term" : "definition";

    // a new session begins, so previously stored mistakes may be stored again
    this.sessionMistakeIDs.clear();

    if (form.value["enable-shuffling"] === "yes") {
      this.cards = this.cards.sort(() => 0.5 - Math.random());
      this.shufflingEnabled = true;
    }

    this.sideText.set(this.cards[0][this.side as keyof Card] as string);
    this.currentCard = this.cards[0];
  }

  reloadPage() {
    this.router.navigateByUrl("/", { skipLocationChange: true }).then(() => {
      this.router.navigate(["/study-set/" + this.setId + "/flashcards"]);
    });
  }

  async ngOnInit(): Promise<void> {
    this.setId = this.route.snapshot.paramMap.get("setId");
    if (!this.setId) {
      await this.router.navigate(["404"]);
      return;
    }

    const set = await this.sets.set(this.setId);
    if (!set) {
      await this.router.navigate(["404"]);
      return;
    }

    this.titleService.setTitle(set.title + " — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Begin studying flashcards " + set.title + " study set on Scholarsome. Improve your memorization skills by taking a quiz." });

    // sort the cards by index
    this.cards = set.cards.sort((a, b) => {
      return a.index - b.index;
    });

    this.updateIndex();
  }
}
