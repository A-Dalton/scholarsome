import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  EventEmitter,
  input,
  OnInit,
  Output,
  signal,
  TemplateRef,
  ViewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AlertComponent } from "../alert/alert.component";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { DomSanitizer } from "@angular/platform-browser";
import { ViewportScroller } from "@angular/common";
import { DeviceDetectorService } from "ngx-device-detector";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { QuillEditorComponent } from "ngx-quill";
import Quill from "quill";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-card",
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.scss"],
  imports: [CommonModule, FormsModule, FontAwesomeModule, QuillEditorComponent, AlertComponent]
})
export class CardComponent implements OnInit, AfterViewInit {
  constructor(
    private readonly bsModalService: BsModalService,
    private readonly vps: ViewportScroller,
    private readonly deviceService: DeviceDetectorService,
    private readonly destroyRef: DestroyRef,
    public readonly sanitizer: DomSanitizer
  ) {
    // Sync the committed display values from the `term`/`definition` inputs whenever
    // the parent rebinds them (e.g. on cancel/restore). Changes made inside the edit
    // modal are kept in `changingTerm`/`changingDefinition` and only committed to
    // `actualTerm`/`actualDefinition` when the modal closes, so typing doesn't update
    // the card behind the modal while editing.
    effect(() => {
      this.changingTerm = this.term();
      this.actualTerm.set(this.term());
    });
    effect(() => {
      this.changingDefinition = this.definition();
      this.actualDefinition.set(this.definition());
    });
  }

  // The working copy shown in the card body. Kept separate from the `term`/`definition`
  // inputs so edits made in the edit modal only appear on the card once it closes.
  protected actualTerm = signal("");
  protected actualDefinition = signal("");

  // Working copy bound to the quill editors while the edit modal is open.
  protected changingTerm = "";
  protected changingDefinition = "";

  // Declared as signal inputs so parent components bind them directly (`[term]="..."`)
  // instead of mutating `ComponentRef.instance` imperatively. Under zoneless + OnPush
  // change detection, this keeps template re-rendering correct.
  readonly editingEnabled = input(false);
  readonly cardIndex = input(0);
  readonly upArrow = input(false);
  readonly downArrow = input(false);
  readonly trashCan = input(false);
  readonly term = input("");
  readonly definition = input("");
  // Stable identity used by parent `@for` structures so cards can be identified across
  // re-renders without relying on a mutable index.
  readonly uid = input("");

  @Output() addCardEvent = new EventEmitter();
  @Output() deleteCardEvent = new EventEmitter<string>();
  @Output() moveCardEvent = new EventEmitter<{ uid: string, direction: number }>();
  @Output() editCardEvent = new EventEmitter();
  // Emitted when the edit modal closes so parents can capture the committed value into
  // their own card model (replacing the old `ComponentRef.instance.term` read-back).
  @Output() termChange = new EventEmitter<string>();
  @Output() definitionChange = new EventEmitter<string>();

  @ViewChild("editModal") modal: TemplateRef<HTMLElement>;

  protected emptyCardAlert = signal(false);

  protected isMobile = false;

  protected modalRef?: BsModalRef;
  protected readonly faPenToSquare = faPenToSquare;

  ngOnInit() {
    this.isMobile = this.deviceService.isMobile();
  }

  ngAfterViewInit() {
    /*
    these two subscriptions here are to prevent the main card from updating
    while the card is being edited

    otherwise it's distracting to see changes in the background while typing
     */
    this.bsModalService.onShow
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.actualTerm.set(String(this.actualTerm()));
          this.actualDefinition.set(String(this.actualDefinition()));
        });

    this.bsModalService.onHide
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.actualTerm.set(this.changingTerm ? this.changingTerm : "");
          this.actualDefinition.set(this.changingDefinition ? this.changingDefinition : "");

          // Let the owning parent store the committed values in its own card model.
          this.termChange.emit(this.changingTerm);
          this.definitionChange.emit(this.changingDefinition);
        });

    // scroll to bottom of cards list
    if (this.editingEnabled()) {
      this.vps.scrollToPosition([0, document.body.scrollHeight]);
    }

    // open the edit modal when new cards are added
    if (
      this.editingEnabled() &&
      !this.term() &&
      !this.definition() &&
      (this.upArrow() || this.downArrow())
    ) {
      this.openEditModal();
    }
  }

  openEditModal() {
    this.modalRef = this.bsModalService.show(this.modal, { class: "modal-xl" });
  }

  deleteCard() {
    this.deleteCardEvent.emit(this.uid());
  }

  notifyEmptyInput() {
    if (!this.emptyCardAlert()) {
      this.emptyCardAlert.set(true);
      setTimeout(() => this.emptyCardAlert.set(false), 3000);
    }
  }

  moveCard(direction: number) {
    this.moveCardEvent.emit({ uid: this.uid(), direction });
  }

  // Set cursor position to end
  focusEditor($event: Quill) {
    $event.setSelection($event.getLength(), 0);
  }
}
