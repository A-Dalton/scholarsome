import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
  input,
  signal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { SrsCardReviewInfo } from "@scholarsome/shared";
import { CardReviewInfoContentComponent } from "./card-review-info-content.component";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-card-review-info",
  templateUrl: "./card-review-info.component.html",
  styleUrls: ["./card-review-info.component.scss"],
  imports: [CommonModule, FontAwesomeModule, CardReviewInfoContentComponent]
})
export class CardReviewInfoComponent implements OnInit {
  constructor(
    private readonly bsModalService: BsModalService
  ) {}

  // Review information of the card, null while the card has not been reviewed yet
  readonly info = input<SrsCardReviewInfo | null>(null);

  @ViewChild("button") button?: ElementRef<HTMLElement>;
  @ViewChild("popover") popover?: ElementRef<HTMLElement>;
  @ViewChild("reviewInfoModal") modal?: TemplateRef<HTMLElement>;

  // Whether the popover is currently shown
  protected readonly open = signal(false);
  // Fixed position of the popover within the viewport
  protected readonly popoverTop = signal(0);
  protected readonly popoverLeft = signal(0);

  // Whether the device has no precise hover capability, e.g. phones and tablets,
  // in which case the information opens as a modal when tapped instead of a tooltip
  private isTouch = true;

  protected modalRef?: BsModalRef;

  protected readonly faChartSimple = faChartSimple;

  ngOnInit(): void {
    this.isTouch = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  /**
   * Shows the popover when the icon is hovered on devices with a precise hover
   * capability, e.g. desktops
   */
  onMouseEnter(): void {
    if (this.isTouch) return;
    this.showPopover();
  }

  /**
   * Hides the popover once the icon is not hovered anymore
   */
  onMouseLeave(): void {
    if (this.isTouch) return;
    this.open.set(false);
  }

  /**
   * Opens the statistics as a modal when the icon is tapped on touch devices,
   * otherwise toggles the popover
   */
  onClick(): void {
    if (!this.info()) return;

    if (this.isTouch) {
      if (!this.modal) return;
      this.modalRef = this.bsModalService.show(this.modal, { class: "modal-dialog-centered" });
      return;
    }

    if (this.open()) this.open.set(false);
    else this.showPopover();
  }

  /**
   * Shows the popover, anchored below the icon and aligned with its right edge,
   * staying within the bounds of the viewport
   */
  private showPopover(): void {
    const button = this.button?.nativeElement;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const margin = 8;
    const width = Math.min(340, window.innerWidth - margin * 2);

    this.popoverLeft.set(Math.min(Math.max(margin, rect.right - width), window.innerWidth - margin - width));
    this.popoverTop.set(rect.bottom + 8);
    this.open.set(true);

    // the popover is flipped above the icon when it would clip the bottom of
    // the viewport; delayed by a frame as its height is only known once rendered
    requestAnimationFrame(() => {
      if (!this.open()) return;

      const popover = this.popover?.nativeElement;
      if (!popover) return;

      const height = popover.offsetHeight;
      if (this.popoverTop() + height > window.innerHeight - margin) {
        this.popoverTop.set(Math.max(margin, rect.top - height - 8));
      }
    });
  }

  @HostListener("window:scroll")
  @HostListener("window:resize")
  onViewportChange(): void {
    this.open.set(false);
  }
}
