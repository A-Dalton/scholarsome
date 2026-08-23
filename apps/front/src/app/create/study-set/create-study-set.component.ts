import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ElementRef, OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  signal
} from "@angular/core";
import { Router } from "@angular/router";
import { SetsService } from "../../shared/http/sets.service";
import { Meta, Title } from "@angular/platform-browser";
import { CardComponent } from "../../shared/card/card.component";
import { faSquarePlus } from "@fortawesome/free-solid-svg-icons";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { SavedSet } from "@scholarsome/shared";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-create",
  templateUrl: "./create-study-set.component.html",
  styleUrls: ["./create-study-set.component.scss"],
  imports: [CommonModule, FormsModule, FontAwesomeModule]
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

  @ViewChild("cardContainer", { static: true, read: ViewContainerRef }) cardContainer: ViewContainerRef;
  @ViewChild("descriptionElement") descriptionInput: ElementRef;
  @ViewChild("restoreProgressModal") restoreProgressModal: TemplateRef<HTMLElement>;

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

  // index starts at 0
  protected cardComponents: { component: ComponentRef<CardComponent>, index: number }[] = [];
  protected cards: {
    cardIndexRef(): number;
    termRef(): string;
    definitionRef(): string;
  }[] = [];

  saveProgress() {
    if (this.existingSet) return;

    if (
      !this.title &&
      !this.description &&
      !this.privateCheck &&
      this.cards.length === 1 &&
      !this.cards[0].termRef() &&
      !this.cards[0].definitionRef()
    ) {
      this.deleteProgress();
      return;
    }

    localStorage.setItem("set", JSON.stringify(
        {
          title: this.title,
          description: this.description,
          private: this.privateCheck,
          cards: this.cards.map((c) => {
            return {
              index: c.cardIndexRef(),
              term: c.termRef(),
              definition: c.definitionRef()
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

    this.cardComponents[0].component.destroy();
    this.cardComponents.pop();
    this.cards.pop();

    for (const card of set.cards) {
      this.addCard({
        index: card.index,
        term: card.term,
        definition: card.definition
      });
    }

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

    for (const card of this.cardComponents) {
      if (card.component.instance.term.length !== 0 && card.component.instance.definition.length !== 0) {
        cards.push({
          index: card.component.instance.cardIndex,
          term: card.component.instance.term,
          definition: card.component.instance.definition
        });
      } else {
        card.component.instance.notifyEmptyInput();
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

  updateCardIndices() {
    for (let i = 0; i < this.cardComponents.length; i++) {
      this.cardComponents[i].component.instance.cardIndex = i;
      this.cardComponents[i].index = i;

      this.cardComponents[i].component.instance.upArrow = i !== 0;
      this.cardComponents[i].component.instance.downArrow = this.cardComponents.length - 1 !== i;
      this.cardComponents[i].component.instance.trashCan = this.cardComponents.length > 1;
    }

    this.saveProgress();
  }

  addCard(config?: {
    index?: number;
    term?: string;
    definition?: string;
  }) {
    const card = this.cardContainer.createComponent<CardComponent>(CardComponent);

    card.instance.cardIndex = config?.index ? config.index : this.cardContainer.length - 1;
    card.instance.term = config?.term ? config.term : "";
    card.instance.definition = config?.definition ? config.definition : "";
    card.instance.editingEnabled = true;

    card.instance.deleteCardEvent.subscribe((e) => {
      if (this.cardContainer.length > 1) {
        const index = this.cardComponents.map((c) => c.index).indexOf(e);

        this.cardContainer.get(e)?.destroy();

        this.cardComponents.splice(index, 1);

        this.cards = this.cards.filter((c) => c.cardIndexRef() !== index);

        this.updateCardIndices();
      }
    });

    card.instance.moveCardEvent.subscribe((e) => {
      if (this.cardContainer.length > 1) {
        const cardIndex = this.cardComponents.map((c) => c.index).indexOf(e.index);

        this.cardContainer.move(this.cardComponents[cardIndex].component.hostView, e.index + e.direction);

        this.cardComponents[this.cardComponents.map((c) => c.index).indexOf(e.index + e.direction)].index = e.index;
        this.cardComponents[cardIndex].index = e.index + e.direction;

        this.cardComponents.sort((a, b) => a.index - b.index);

        this.updateCardIndices();
      }
    });

    card.instance.editCardEvent.subscribe(() => {
      this.saveProgress();
    });

    card.instance.addCardEvent.subscribe(() => {
      this.addCard();
    });

    this.cardComponents.push({
      component: card,
      index: this.cardContainer.length - 1
    });

    this.cards.push({
      cardIndexRef: () => card.instance.cardIndex,
      termRef: () => card.instance.term ? card.instance.term : "",
      definitionRef: () => card.instance.definition ? card.instance.definition : ""
    });

    this.saveProgress();

    this.updateCardIndices();
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
