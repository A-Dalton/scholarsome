import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  viewChildren,
  signal
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Set } from "@scholarsome/shared";
import { SetsService } from "../shared/http/sets.service";
import { CardComponent } from "../shared/card/card.component";
import { UsersService } from "../shared/http/users.service";
import { Meta, Title } from "@angular/platform-browser";
import { QuizletExportModalComponent } from "./quizlet-export-modal/quizlet-export-modal.component";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { faFileExport, faShareFromSquare, faPencil, faSave, faCancel, faTrashCan, faClipboard, faStar, faQ, faFileCsv, faImages } from "@fortawesome/free-solid-svg-icons";
import { ConvertingService } from "../shared/http/converting.service";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

interface DraftCard {
  uid: string;
  id?: string;
  isSaved: boolean;
  editingEnabled: boolean;
  term: string;
  definition: string;
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-study-set",
  templateUrl: "./study-set.component.html",
  styleUrls: ["./study-set.component.scss"],
  imports: [CommonModule, FontAwesomeModule, RouterLink, QuizletExportModalComponent, CardComponent]
})
export class StudySetComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly users: UsersService,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly setsService: SetsService,
    private readonly convertingService: ConvertingService
  ) {}

  @ViewChild("spinner", { static: true }) spinner: ElementRef;
  @ViewChild("container", { static: true }) container: ElementRef;
  @ViewChild("privateCheck", { static: false }) privateCheck: ElementRef;
  @ViewChild("editDescription", { static: false }) editDescription: ElementRef;
  @ViewChild("editTitle", { static: false }) editTitle: ElementRef;

  @ViewChild("quizletExportModal") quizletExportModal: QuizletExportModalComponent;

  // Cards are rendered declaratively with `@for` over this signal. Each card exposes the
  // committed values through `(termChange)`/`(definitionChange)` so the model always holds
  // the latest saved data, replacing the old `ComponentRef.instance.term` read-back.
  protected cards = signal<DraftCard[]>([]);

  // Only needed to call `notifyEmptyInput()` on a specific card instance during save
  // validation; everything else flows through inputs/outputs.
  protected readonly cardViews = viewChildren(CardComponent);

  protected userIsAuthor = signal(false);
  protected isEditing = signal(false);
  protected setId: string | null;

  protected author = signal("");

  protected set = signal<Set | undefined>(undefined);

  protected saveInProgress = signal(false);
  protected ankiExportInProgress = signal(false);
  protected csvExportInProgress = signal(false);
  protected mediaExportInProgress = signal(false);
  protected uploadTooLarge = signal(false);
  protected deleteClicked = signal(false);

  // to disable clipboard button in share dropdown on non https
  protected isHttps = true;

  protected readonly faQuestionCircle = faQuestionCircle;
  protected readonly faFileExport = faFileExport;
  protected readonly faShareFromSquare = faShareFromSquare;
  protected readonly faPencil = faPencil;
  protected readonly faSave = faSave;
  protected readonly faCancel = faCancel;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faClipboard = faClipboard;
  protected readonly faStar = faStar;
  protected readonly faQ = faQ;
  protected readonly faFileCsv = faFileCsv;
  protected readonly faImages = faImages;

  protected readonly navigator = navigator;
  protected readonly window = window;

  openQuizletExport() {
    if (this.set()) {
      this.quizletExportModal.open(this.set()!);
    }
  }

  async exportSetToAnkiApkg() {
    this.ankiExportInProgress.set(true);

    const file = await this.convertingService.exportSetToAnkiApkg(this.set()!.id);
    if (!file) {
      this.ankiExportInProgress.set(false);
      return;
    }

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(file);
    link.download = this.set()!.title + ".apkg";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    this.ankiExportInProgress.set(false);
  }

  async exportSetToCsv() {
    this.csvExportInProgress.set(true);

    const file = await this.convertingService.exportSetToCsv(this.set()!.id);
    if (!file) {
      this.csvExportInProgress.set(false);
      return;
    }

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(file);
    link.download = this.set()!.title + ".csv";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    this.csvExportInProgress.set(false);
  }

  async exportSetMedia() {
    this.mediaExportInProgress.set(true);

    const file = await this.convertingService.exportSetMedia(this.set()!.id);
    if (!file) {
      this.mediaExportInProgress.set(false);
      return;
    }

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(file);
    link.download = this.set()!.title + ".zip";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    this.mediaExportInProgress.set(false);
  }

  addCard(opts: {
    id?: string;
    isSaved: boolean;
    index?: number;
    editingEnabled: boolean;
    term?: string;
    definition?: string;
  }) {
    this.cards.update((cards) => [
      ...cards,
      {
        uid: crypto.randomUUID(),
        id: opts.id,
        isSaved: opts.isSaved,
        editingEnabled: opts.editingEnabled,
        term: opts.term ? opts.term : "",
        definition: opts.definition ? opts.definition : ""
      }
    ]);
  }

  deleteCard(uid: string) {
    if (this.cards().length > 1) {
      this.cards.update((cards) => cards.filter((card) => card.uid !== uid));
    }
  }

  moveCard(event: { uid: string, direction: number }) {
    if (this.cards().length > 1) {
      this.cards.update((cards) => {
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

  editCards() {
    this.isEditing.set(true);

    this.cards.update((cards) => cards.map((card) => ({ ...card, editingEnabled: true })));
  }

  async saveCards() {
    if (!this.set()) return;

    this.saveInProgress.set(true);

    const views = this.cardViews();
    for (let i = 0; i < this.cards().length; i++) {
      const card = this.cards()[i];
      if (card.term.length < 1 || card.definition.length < 1) {
        this.saveInProgress.set(false);
        views[i]?.notifyEmptyInput();
        return;
      }
    }

    this.cards.update((cards) => cards.map((card) => ({ ...card, editingEnabled: false })));

    this.set()!.description = this.editDescription.nativeElement.value;

    const updated = await this.setsService.updateSet({
      id: this.set()!.id,
      title: this.editTitle.nativeElement.value,
      description: this.editDescription.nativeElement.value,
      private: this.privateCheck.nativeElement.checked,
      cards: this.cards().map((card, index) => {
        return {
          id: card.id ? card.id : "",
          index,
          term: card.term,
          definition: card.definition
        };
      })
    });

    if (updated === "tooLarge") {
      this.cards.update((cards) => cards.map((card) => ({ ...card, editingEnabled: true })));

      this.isEditing.set(true);
      this.uploadTooLarge.set(true);
      this.saveInProgress.set(false);
      return;
    }

    if (!updated) {
      this.cards.update((cards) => cards.map((card) => ({ ...card, editingEnabled: true })));

      this.isEditing.set(true);
      this.saveInProgress.set(false);
      return;
    }
    this.set.set(updated);

    this.cards.set([]);

    this.isEditing.set(false);
    this.saveInProgress.set(false);
    this.viewCards();
  }

  viewCards() {
    this.isEditing.set(false);

    // if viewCards is called because page is loading
    if (this.cards().length === 0) {
      if (this.set()) {
        // sort the cards by index
        for (const card of this.set()!.cards.sort((a, b) => {
          return a.index - b.index;
        })) {
          this.addCard({
            id: card.id,
            isSaved: true,
            index: card.index,
            editingEnabled: false,
            term: card.term,
            definition: card.definition
          });
        }
      }
    } else {
      // if viewCards is called because editing was canceled, restore the saved cards
      // (unsaved cards are dropped, terms/definitions reset, and order reverts to the
      // original index so the cancel returns the set to its saved state).
      const saved = this.set()!.cards.sort((a, b) => a.index - b.index);

      this.cards.set(
          saved.map((savedCard) => {
            // look up the matching draft card to keep unsaved cards filtered out
            const draft = this.cards().find((card) => card.isSaved && card.id === savedCard.id);
            return {
              uid: draft ? draft.uid : crypto.randomUUID(),
              id: savedCard.id,
              isSaved: true,
              editingEnabled: false,
              term: savedCard.term,
              definition: savedCard.definition
            };
          })
      );
    }
  }

  async deleteSet() {
    await this.setsService.deleteSet(this.set()!.id);
    await this.router.navigate(["homepage"]);
  }

  async ngOnInit(): Promise<void> {
    this.setId = this.route.snapshot.paramMap.get("setId");
    if (!this.setId) {
      this.router.navigate(["404"]);
      return;
    }

    const set = await this.setsService.set(this.setId);
    if (!set) {
      this.router.navigate(["404"]);
      return;
    }

    this.titleService.setTitle(set.title + " Set — Scholarsome");

    let description = "Study the " + set.title + " set for free on Scholarsome — ";

    const firstThree = set.cards.slice(0, 3);

    for (const card of firstThree) {
      description += card.term.replace(/(\r\n|\n|\r)/gm, "") + " " + card.definition.replace(/(\r\n|\n|\r)/gm, "") + ". ";
    }

    this.metaService.addTag({ name: "description", content: description });

    const user = await this.users.myUser();

    this.set.set(set);

    if (user && user.id === set.authorId) this.userIsAuthor.set(true);

    if (window.location.href.slice(0, 5) !== "https") {
      this.isHttps = false;
    }

    this.spinner.nativeElement.remove();

    this.author.set(this.set()!.author.username);
    this.container.nativeElement.removeAttribute("hidden");

    this.viewCards();
  }
}
