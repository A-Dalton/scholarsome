import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { CardMistake } from "@scholarsome/shared";
import { Meta, Title } from "@angular/platform-browser";
import { DomSanitizer } from "@angular/platform-browser";
import { CardMistakesService } from "../shared/http/card-mistakes.service";
import { SetsService } from "../shared/http/sets.service";
import { Router } from "@angular/router";
import { faCheck, faHistory, faSquarePlus } from "@fortawesome/free-solid-svg-icons";

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "scholarsome-card-mistakes",
  templateUrl: "./card-mistakes.component.html",
  styleUrls: ["./card-mistakes.component.scss"]
})
export class CardMistakesComponent implements OnInit {
  @ViewChild("container", { static: true }) container: ElementRef;
  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  mistakes: CardMistake[] | null = null;

  // IDs of the selected mistakes, used to create a study set
  selected = new Set<string>();
  protected title = "";
  protected creating = false;
  protected errorEncountered = false;

  protected readonly faHistory = faHistory;
  protected readonly faSquarePlus = faSquarePlus;
  protected readonly faCheck = faCheck;

  constructor(
    private readonly cardMistakesService: CardMistakesService,
    private readonly setsService: SetsService,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    public readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.titleService.setTitle("Previous mistakes — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Review the flashcards you previously did not know on Scholarsome." });
  }

  async ngOnInit(): Promise<void> {
    this.mistakes = await this.cardMistakesService.mistakes();

    if (this.mistakes) {
      this.mistakes.forEach((m) => {
        m.createdAt = new Date(m.createdAt);
      });
    }

    this.spinner.nativeElement.remove();
    this.container.nativeElement.removeAttribute("hidden");

    // The mistakes are loaded asynchronously. Mark the view for change detection so
    // it re-renders with the loaded mistakes data.
    this.cdr.markForCheck();
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
   * Creates a new study set from the currently selected mistakes
   */
  async createStudySet() {
    if (this.creating) return;

    if (this.selected.size === 0 || !this.title) {
      this.errorEncountered = true;
      setTimeout(() => this.errorEncountered = false, 3000);
      return;
    }

    this.creating = true;
    this.errorEncountered = false;

    if (!this.mistakes) {
      this.creating = false;
      this.errorEncountered = true;
      return;
    }

    const cards = this.mistakes
        .filter((m) => this.selected.has(m.id))
        .map((m, index) => ({
          index,
          term: m.term,
          definition: m.definition
        }));

    const set = await this.setsService.createSet({
      title: this.title,
      private: false,
      cards
    });

    if (set && set.id) {
      await this.router.navigate(["/study-set/" + set.id]);
    } else {
      this.creating = false;
      this.errorEncountered = true;
    }
  }
}
