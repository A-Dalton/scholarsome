import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  viewChildren,
  signal
} from "@angular/core";
import { Router } from "@angular/router";
import { SetsService } from "../../shared/http/sets.service";
import { Meta, Title } from "@angular/platform-browser";
import { CardComponent } from "../../shared/card/card.component";
import { faSquarePlus } from "@fortawesome/free-solid-svg-icons";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { randomUUID, SavedSet } from "@scholarsome/shared";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

interface DraftCard {
  uid: string;
  term: string;
  definition: string;
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-create",
  templateUrl: "./create-study-set.component.html",
  styleUrls: ["./create-study-set.component.scss"],
  imports: [CommonModule, FormsModule, FontAwesomeModule, CardComponent]
})
export class CreateStudySetComponent implements OnInit, AfterViewInit {
  constructor(
    private readonly router: Router,
    private readonly sets: SetsService,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly bsModalService: BsModalService
  ) {
    this.titleService.setTitle("Create a set — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Create a free new Scholarsome study set. Scholarsome is the way studying was meant to be." });
  }

  @ViewChild("descriptionElement") descriptionInput: ElementRef;
  @ViewChild("restoreProgressModal") restoreProgressModal: TemplateRef<HTMLElement>;

  // Cards are rendered declaratively with `@for` over this signal.
  protected draftCards = signal<DraftCard[]>([]);

  // Only needed to call `notifyEmptyInput()` on a specific card instance during save
  // validation; everything else flows through inputs/outputs.
  protected readonly cardViews = viewChildren(CardComponent);

  protected title = "";
  protected description = "";
  protected privateCheck = false;

  protected formDisabled = signal(false);
  protected errorEncountered = signal(false);

  // Track whether the user has attempted to submit without a title, so the
  // inline validation error below the title field is only shown after an attempt
  // (matching the behavior of the folder creation page).
  protected titleTouched = signal(false);

  protected modalRef?: BsModalRef;
  protected existingSet = true;

  protected readonly faQuestionCircle = faQuestionCircle;
  protected readonly faSquarePlus = faSquarePlus;

  saveProgress() {
    if (this.existingSet) return;

    if (
      !this.title &&
      !this.description &&
      !this.privateCheck &&
      this.draftCards().length === 1 &&
      !this.draftCards()[0].term &&
      !this.draftCards()[0].definition
    ) {
      this.deleteProgress();
      return;
    }

    localStorage.setItem("set", JSON.stringify(
        {
          title: this.title,
          description: this.description,
          private: this.privateCheck,
          cards: this.draftCards().map((card, index) => {
            return {
              index,
              term: card.term,
              definition: card.definition
            };
          })
        }
    ));
  }

  deleteProgress() {
    localStorage.removeItem("set");
    this.existingSet = false;
  }

  restoreProgress() {
    const savedSetObj = localStorage.getItem("set");
    if (!savedSetObj) return;

    const set: SavedSet = JSON.parse(savedSetObj);
    set.cards = set.cards.sort((a, b) => a.index - b.index);

    this.title = set.title;
    this.description = set.description;
    this.privateCheck = set.private;

    this.draftCards.set(
        set.cards.map((card) => ({ uid: randomUUID(), term: card.term, definition: card.definition }))
    );

    this.existingSet = false;
  }

  async createSet() {
    const cards: { index: number; term: string; definition: string; }[] = [];

    this.errorEncountered.set(false);

    if (!this.title) {
      this.titleTouched.set(true);
      return;
    } else {
      this.titleTouched.set(false);
    }

    const views = this.cardViews();
    for (let i = 0; i < this.draftCards().length; i++) {
      const card = this.draftCards()[i];
      if (card.term.length !== 0 && card.definition.length !== 0) {
        cards.push({
          index: i,
          term: card.term,
          definition: card.definition
        });
      } else {
        views[i]?.notifyEmptyInput();
        return;
      }
    }

    this.formDisabled.set(true);

    const set = await this.sets.createSet({
      title: this.title,
      description: this.description,
      private: this.privateCheck,
      cards
    });

    if (set && set.id) {
      this.deleteProgress();
      await this.router.navigate(["/study-set/" + set?.id]);
    } else {
      this.formDisabled.set(false);
      this.errorEncountered.set(true);
    }
  }

  addCard(config?: {
    term?: string;
    definition?: string;
  }) {
    const term = config?.term ? config.term : "";
    const definition = config?.definition ? config.definition : "";

    this.draftCards.update((cards) => [
      ...cards,
      { uid: randomUUID(), term, definition }
    ]);
  }

  removeCard(uid: string) {
    if (this.draftCards().length > 1) {
      this.draftCards.update((cards) => cards.filter((card) => card.uid !== uid));
    }
  }

  moveCard(event: { uid: string, direction: number }) {
    if (this.draftCards().length > 1) {
      this.draftCards.update((cards) => {
        const from = cards.findIndex((card) => card.uid === event.uid);
        if (from === -1) return cards;

        const to = from + event.direction;
        if (to < 0 || to >= cards.length) return cards;

        const next = [...cards];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    }
  }

  ngOnInit() {
    this.addCard();
  }

  ngAfterViewInit(): void {
    const savedSetObject = localStorage.getItem("set");

    if (savedSetObject) {
      const savedSet: SavedSet = JSON.parse(savedSetObject);

      if (
        !savedSet.title &&
        !savedSet.description &&
        !savedSet.private &&
        !(savedSet.cards.length === 1) &&
        !savedSet.cards[0].term &&
        !savedSet.cards[0].definition
      ) {
        this.deleteProgress();
        return;
      }

      this.modalRef = this.bsModalService.show(this.restoreProgressModal, {
        ignoreBackdropClick: true
      });
    } else {
      this.deleteProgress();
    }
  }
}
