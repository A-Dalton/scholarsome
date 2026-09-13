import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

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
  imports: [CommonModule, FontAwesomeModule]
})
export class FlashcardControlsComponent {
  /** Buttons of the lower card, rendered equally distributed across the width */
  readonly actions = input<FlashcardControlAction[]>([]);

  /** Amount of cards the session has progressed past, shown on the progress bar */
  readonly progress = input(0);

  /** Total amount of cards of the session, shown on the progress bar */
  readonly total = input(0);

  /** Optional word displayed after the "x/y" counter, e.g. "learned" */
  readonly counterLabel = input<string | undefined>(undefined);

  /**
   * Text of the counter below the progress bar
   */
  counterText(): string {
    const label = this.counterLabel();
    return `${this.progress()}/${this.total()}${label ? " " + label : ""}`;
  }

  // On touch devices, briefly fill the pressed button's background (like a
  // mouse hover would) then let it return to neutral, since sticky :hover
  // would otherwise persist the color.
  flash(event: Event): void {
    if (!window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const button = event.currentTarget as HTMLButtonElement;
    // Restart the one-shot animation on every tap so it re-fills each time
    button.classList.remove("flash-bg");
    void button.offsetWidth;
    button.classList.add("flash-bg");
  }
}
