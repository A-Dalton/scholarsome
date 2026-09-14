import { ChangeDetectionStrategy, Component, ElementRef, QueryList, ViewChildren, input } from "@angular/core";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HoverGuardDirective } from "./hover-guard.directive";

/**
 * A single button of the lower card of a flashcard training session
 */
export interface FlashcardControlAction {
  /** Visible label of the button, omitted for icon-only buttons */
  label?: string;
  /** Icon shown instead of the label */
  icon?: IconProp;
  /** Bootstrap variant class of the button, e.g. "btn-outline-danger" */
  variant: string;
  /** Keyboard key that performs the action, shown as a keycap hint */
  key?: string;
  /** Accessible name of the button, defaults to the label */
  ariaLabel?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Performed when the button is pressed */
  action: () => void;
}

/**
 * Lower card shared by every way of training with flashcards: the action
 * buttons equally distributed across the width and the counter with a
 * progress bar. Owning the markup and the styles in this single component
 * keeps all training modes looking the same without duplicating either.
 */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-flashcard-controls",
  templateUrl: "./flashcard-controls.component.html",
  styleUrls: ["./flashcard-controls.component.scss"],
  imports: [CommonModule, FontAwesomeModule, HoverGuardDirective]
})
export class FlashcardControlsComponent {
  /** Buttons of the lower card, rendered equally distributed across the width */
  readonly actions = input<FlashcardControlAction[]>([]);

  /** Amount of cards the session has progressed past, shown on the counter */
  readonly progress = input(0);

  /** Value the progress bar fill is based on; defaults to `progress`.
   *  Lets the bar lag behind the counter, e.g. Traditional/Progressive
   *  flashcards count the first card as 0% of the session completed */
  readonly barProgress = input<number | undefined>(undefined);

  /** Total amount of cards of the session, shown on the progress bar */
  readonly total = input(0);

  /** Denominator the progress bar fill is scaled against; defaults to `total`.
   *  Traditional flashcards scale the bar across `total - 1` steps so the
   *  last card shows 100% instead of lagging one card behind the counter */
  readonly barTotal = input<number | undefined>(undefined);

  /** Optional word displayed after the "x/y" counter, e.g. "learned" */
  readonly counterLabel = input<string | undefined>(undefined);

  /** Buttons of the actions, flashed when an action is triggered without a tap */
  @ViewChildren("actionButton") private actionButtons: QueryList<ElementRef<HTMLButtonElement>>;

  /**
   * Text of the counter below the progress bar
   */
  counterText(): string {
    const label = this.counterLabel();
    return `${this.progress()}/${this.total()}${label ? " " + label : ""}`;
  }

  /**
   * Value the progress bar fill and its aria-valuenow are based on
   */
  barValue(): number {
    return this.barProgress() ?? this.progress();
  }

  /**
   * Percentage of the progress bar that is filled
   */
  barPercent(): number {
    const denominator = this.barTotal() ?? this.total();
    return denominator > 0 ? (100 * this.barValue()) / denominator : 0;
  }

  // On touch devices, briefly fill the pressed button's background (like a
  // mouse hover would) then let it return to neutral, since sticky :hover
  // would otherwise persist the color. Devices with a real hover show the
  // native :hover feedback instead.
  flash(event: Event): void {
    if (!window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    this.flashButton(event.currentTarget as HTMLButtonElement);
  }

  /**
   * Runs the flash feedback animation on the button of the action at the
   * given index, e.g. when the action is triggered with the keyboard
   */
  flashAction(index: number): void {
    const button = this.actionButtons?.get(index)?.nativeElement;
    if (button) this.flashButton(button);
  }

  /**
   * Runs the flash feedback animation on the given button
   */
  private flashButton(button: HTMLButtonElement): void {
    // Restart the one-shot animation on every trigger so it re-fills each time
    button.classList.remove("flash-bg");
    void button.offsetWidth;
    button.classList.add("flash-bg");
  }
}
