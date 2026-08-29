import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, computed, signal } from "@angular/core";
import { CardMistake } from "@scholarsome/shared";
import { Meta, Title } from "@angular/platform-browser";
import { DomSanitizer } from "@angular/platform-browser";
import { CardMistakesService } from "../shared/http/card-mistakes.service";
import { SetsService } from "../shared/http/sets.service";
import { Router, RouterLink } from "@angular/router";
import { faChevronRight, faFolderOpen, faHistory, faSquarePlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faCheckSquare, faQuestionCircle, faSquare } from "@fortawesome/free-regular-svg-icons";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AlertComponent } from "../shared/alert/alert.component";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-card-mistakes",
  templateUrl: "./card-mistakes.component.html",
  styleUrls: ["./card-mistakes.component.scss"],
  imports: [CommonModule, FormsModule, FontAwesomeModule, RouterLink, AlertComponent]
})
export class CardMistakesComponent implements OnInit {
  @ViewChild("container", { static: true }) container: ElementRef;
  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  mistakes = signal<CardMistake[] | null>(null);

  /**
   * The mistakes grouped by their study set, ordered so that the study set
   * containing the most recently made mistake is displayed first
   */
  groups = computed(() => {
    const mistakes = this.mistakes();
    if (!mistakes) return null;

    const groups: { set: CardMistake["set"]; mistakes: CardMistake[] }[] = [];
    const groupMap = new Map<string, { set: CardMistake["set"]; mistakes: CardMistake[] }>();

    for (const mistake of mistakes) {
      let group = groupMap.get(mistake.set.id);
      if (!group) {
        group = { set: mistake.set, mistakes: [] };
        groupMap.set(mistake.set.id, group);
        groups.push(group);
      }
      group.mistakes.push(mistake);
    }

    return groups;
  });

  // IDs of the selected mistakes, used to create a study set
  selected = new Set<string>();
  title = "";
  creating = signal(false);
  errorEncountered = signal(false);

  protected readonly faHistory = faHistory;
  protected readonly faSquarePlus = faSquarePlus;
  protected readonly faSquare = faSquare;
  protected readonly faCheckSquare = faCheckSquare;
  protected readonly faFolderOpen = faFolderOpen;
  protected readonly faChevronRight = faChevronRight;
  protected readonly faTrash = faTrash;
  protected readonly faQuestionCircle = faQuestionCircle;

  constructor(
    private readonly cardMistakesService: CardMistakesService,
    private readonly setsService: SetsService,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    public readonly sanitizer: DomSanitizer
  ) {
    this.titleService.setTitle("Previous mistakes — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Review the flashcards you previously did not know on Scholarsome." });
  }

  async ngOnInit(): Promise<void> {
    const mistakes = await this.cardMistakesService.mistakes();

    if (mistakes) {
      mistakes.forEach((m) => {
        m.createdAt = new Date(m.createdAt);
      });
    }

    this.mistakes.set(mistakes);

    this.spinner.nativeElement.remove();
    this.container.nativeElement.removeAttribute("hidden");
  }

  /**
   * Toggles whether a mistake is selected for the creation of a study set
   *
   * @param mistakeId ID of the mistake to toggle
   */
  toggleSelect(mistakeId: string) {
    if (this.selected.has(mistakeId)) {
      this.selected.delete(mistakeId);
    } else {
      this.selected.add(mistakeId);
    }
  }

  /**
   * Checks whether a mistake is currently selected
   *
   * @param mistakeId ID of the mistake to check
   *
   * @returns Whether the mistake is selected
   */
  isSelected(mistakeId: string): boolean {
    return this.selected.has(mistakeId);
  }

  /**
   * Deletes a previous mistake and removes it from the displayed state
   *
   * @param mistakeId ID of the mistake to delete
   */
  async deleteMistake(mistakeId: string) {
    const deleted = await this.cardMistakesService.deleteMistake(mistakeId);
    if (!deleted) return;

    const mistakes = this.mistakes();
    if (!mistakes) return;

    this.mistakes.set(mistakes.filter((m) => m.id !== mistakeId));
    this.selected.delete(mistakeId);
  }

  /**
   * Creates a new study set from the currently selected mistakes
   */
  async createStudySet() {
    if (this.creating()) return;

    if (this.selected.size === 0 || !this.title) {
      this.errorEncountered.set(true);
      setTimeout(() => this.errorEncountered.set(false), 3000);
      return;
    }

    this.creating.set(true);
    this.errorEncountered.set(false);

    if (!this.mistakes()) {
      this.creating.set(false);
      this.errorEncountered.set(true);
      return;
    }

    const cards = this.mistakes()!
        .filter((m) => this.selected.has(m.id))
        .map((m, index) => ({
          index,
          term: m.term,
          definition: m.definition
        }));

    const set = await this.setsService.createSet({
      title: this.title,
      private: true,
      cards
    });

    if (set && set.id) {
      await this.router.navigate(["/study-set/" + set.id]);
    } else {
      this.creating.set(false);
      this.errorEncountered.set(true);
    }
  }
}
