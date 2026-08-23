import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  signal
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
  imports: [CommonModule, FormsModule, FontAwesomeModule, QuillEditorComponent]
})
export class CardComponent implements OnInit, AfterViewInit {
  constructor(
    private readonly bsModalService: BsModalService,
    private readonly vps: ViewportScroller,
    private readonly deviceService: DeviceDetectorService,
    private readonly destroyRef: DestroyRef,
    public readonly sanitizer: DomSanitizer
  ) {}

  protected changingTerm: string;
  protected changingDefinition: string;

  // These inputs are mutated imperatively by parent components via
  // `ViewContainerRef.createComponent<CardComponent>()`. Under zoneless + OnPush change
  // detection, plain `@Input` assignments don't re-render the template, so each one is
  // backed by a signal. The getter/setter form keeps the parent assignment API
  // (`instance.editingEnabled = true`) working while the signal schedules re-renders.
  protected editingEnabledSignal = signal(false);
  protected cardIndexSignal = signal(0);
  protected upArrowSignal = signal(true);
  protected downArrowSignal = signal(true);
  protected trashCanSignal = signal(true);

  @Input()
  get editingEnabled(): boolean {
    return this.editingEnabledSignal();
  }
  set editingEnabled(value: boolean) {
    this.editingEnabledSignal.set(value);
  }

  @Input() cardId: string;

  @Input()
  get cardIndex(): number {
    return this.cardIndexSignal();
  }
  set cardIndex(value: number) {
    this.cardIndexSignal.set(value);
  }

  @Input() originalIndex: number;
  @Input() isSaved: boolean;

  @Input()
  get upArrow(): boolean {
    return this.upArrowSignal();
  }
  set upArrow(value: boolean) {
    this.upArrowSignal.set(value);
  }

  @Input()
  get downArrow(): boolean {
    return this.downArrowSignal();
  }
  set downArrow(value: boolean) {
    this.downArrowSignal.set(value);
  }

  @Input()
  get trashCan(): boolean {
    return this.trashCanSignal();
  }
  set trashCan(value: boolean) {
    this.trashCanSignal.set(value);
  }

  @Output() addCardEvent = new EventEmitter();
  @Output() deleteCardEvent = new EventEmitter<number>();
  @Output() moveCardEvent = new EventEmitter<{ index: number, direction: number }>();
  @Output() indexChangeEvent = new EventEmitter<{ newIndex: number }>();
  @Output() editCardEvent = new EventEmitter();

  @ViewChild("card", { static: false }) cardElement: Element;
  @ViewChild("termDiv", { static: false }) termElement: ElementRef;
  @ViewChild("definitionDiv", { static: false }) definitionElement: ElementRef;
  @ViewChild("inputsContainer", { static: false, read: ViewContainerRef }) inputsContainer: ViewContainerRef;

  @ViewChild("editModal") modal: TemplateRef<HTMLElement>;

  // these two vars exist so that we can prevent the main card
  // from updating while a card is being edited
  // Signals so that changes made in async modal events are picked up under zoneless change detection.
  protected actualTerm = signal("");
  protected actualDefinition = signal("");

  protected emptyCardAlert = false;

  protected isMobile = false;

  protected modalRef?: BsModalRef;
  protected readonly faPenToSquare = faPenToSquare;

  ngOnInit() {
    this.actualTerm.set(this.changingTerm ? this.changingTerm : "");
    this.actualDefinition.set(this.changingDefinition ? this.changingDefinition : "");

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
        });

    // scroll to bottom of cards list
    if (this.editingEnabled) {
      this.vps.scrollToPosition([0, document.body.scrollHeight]);
    }

    // open the edit modal when new cards are added
    if (
      this.editingEnabled &&
      !this.changingTerm &&
      !this.changingDefinition &&
      (this.upArrow || this.downArrow)
    ) {
      this.openEditModal();
    }
  }

  @Input()
  get term(): string {
    return this.actualTerm();
  }
  set term(value: string) {
    this.changingTerm = value;
    this.actualTerm.set(value);
  }

  @Input()
  get definition(): string {
    return this.actualDefinition();
  }
  set definition(value: string) {
    this.changingDefinition = value;
    this.actualDefinition.set(value);
  }

  openEditModal() {
    this.modalRef = this.bsModalService.show(this.modal, { class: "modal-xl" });
  }

  deleteCard() {
    this.deleteCardEvent.emit(this.cardIndex);
  }

  notifyEmptyInput() {
    if (!this.emptyCardAlert) {
      const alert = this.inputsContainer.createComponent<AlertComponent>(AlertComponent);

      alert.instance.message = "Both fields cannot be empty";
      alert.instance.type = "danger";
      alert.instance.spacingClass = "mt-4";

      this.emptyCardAlert = true;
      setTimeout(() => this.emptyCardAlert = false, 3000);
    }
  }

  moveCard(direction: number) {
    this.moveCardEvent.emit({ index: this.cardIndex, direction });
  }

  // Set cursor position to end
  focusEditor($event: Quill) {
    $event.setSelection($event.getLength(), 0);
  }
}
