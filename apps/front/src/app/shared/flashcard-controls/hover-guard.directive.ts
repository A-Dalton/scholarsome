import { Directive, ElementRef, OnDestroy, effect, input } from "@angular/core";

/**
 * A button that transitions from disabled to enabled while the cursor happens
 * to rest on it instantly becomes a hover target again: after the DOM change
 * the browser re-evaluates the hover state and applies :hover without the
 * mouse moving, so the button lights up in its filled "active" look although
 * it was never really hovered. This happens in Traditional flashcards when a
 * greyed out arrow is enabled by navigating while the cursor rests on it.
 * The guard class added here suppresses the hover styling of the button until
 * the mouse moves again, which is the point where a coincidental rest can be
 * told apart from a real hover.
 */
@Directive({
  selector: "button[scholarsomeHoverGuard]",
  standalone: true
})
export class HoverGuardDirective implements OnDestroy {
  private wasDisabled = false;
  private clearGuard?: () => void;

  /** Mirrors the [disabled] binding of the button so transitions can be detected */
  readonly scholarsomeHoverGuard = input(false);

  constructor(private readonly host: ElementRef<HTMLElement>) {
    effect(() => {
      const disabled = this.scholarsomeHoverGuard();

      if (this.wasDisabled && !disabled) {
        this.arm();
      }

      this.wasDisabled = disabled;
    });
  }

  ngOnDestroy(): void {
    this.disarm();
  }

  private arm(): void {
    this.disarm();

    this.host.nativeElement.classList.add("hover-guard");

    const clear = () => this.disarm();
    document.addEventListener("mousemove", clear, { once: true, passive: true });
    this.clearGuard = clear;
  }

  private disarm(): void {
    if (!this.clearGuard) return;

    document.removeEventListener("mousemove", this.clearGuard);
    this.host.nativeElement.classList.remove("hover-guard");
    this.clearGuard = undefined;
  }
}
