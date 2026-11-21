import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-solid-svg-icons";
import { SrsCardReviewInfo, SrsRating, SrsState } from "@scholarsome/shared";

type SrsReviewHistoryEntry = SrsCardReviewInfo["history"][number];

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-card-review-info-content",
  templateUrl: "./card-review-info-content.component.html",
  styleUrls: ["./card-review-info-content.component.scss"],
  imports: [CommonModule, FontAwesomeModule]
})
export class CardReviewInfoContentComponent {
  // Review information of the card, null while the card has not been reviewed yet
  readonly info = input<SrsCardReviewInfo | null>(null);

  protected readonly faCalendarCheck = faCalendarCheck;
  // Exposed for the state comparisons of the template
  protected readonly SrsState = SrsState;
  // Width of a bar of the review history chart in pixels; the horizontal
  // position of a bar is computed from it, so both must stay in sync
  protected readonly historyBarWidth = 6;

  /**
   * CSS class of the due pill of the card
   *
   * @param info Review information of the card
   */
  protected duePillClass(info: SrsCardReviewInfo): "due-now" | "due-later" | "due-new" | "due-none" {
    if (!info.due) return info.state === SrsState.New ? "due-new" : "due-none";
    return new Date(info.due).getTime() <= Date.now() ? "due-now" : "due-later";
  }

  /**
   * Text of the due pill of the card
   *
   * @param info Review information of the card
   */
  protected duePillText(info: SrsCardReviewInfo): string {
    if (!info.due) return info.state === SrsState.New ? "New" : "Not scheduled";

    const diff = new Date(info.due).getTime() - Date.now();
    if (diff <= 0) return "Due now";
    return "Due in " + this.humanizeDuration(diff);
  }

  /**
   * Whether a due date of a card has passed
   *
   * @param due ISO 8601 encoded due date of the card
   */
  protected isDue(due: string | null): boolean {
    return !!due && new Date(due).getTime() <= Date.now();
  }

  /**
   * Formats a duration as a coarse human readable string, e.g. "3 days"
   *
   * @param ms Duration in milliseconds
   */
  private humanizeDuration(ms: number): string {
    const minutes = ms / 60000;
    const hours = minutes / 60;
    const days = hours / 24;
    const months = days / 30.44;
    const years = days / 365.25;

    if (minutes < 1) return "under a minute";
    if (hours < 1) return this.pluralize(Math.max(1, Math.round(minutes)), "minute");
    if (days < 1) return this.pluralize(Math.max(1, Math.round(hours)), "hour");
    if (months < 1) return this.pluralize(Math.max(1, Math.round(days)), "day");
    if (years < 1) return this.pluralize(Math.max(1, Math.round(months)), "month");
    return this.pluralize(Math.max(1, Math.round(years)), "year");
  }

  /**
   * Formats an amount as "1 minute" or "3 days"
   *
   * @param amount Amount of units
   * @param unit Singular of the unit
   */
  private pluralize(amount: number, unit: string): string {
    return amount + " " + unit + (amount === 1 ? "" : "s");
  }

  /**
   * CSS class of the chart elements of a rating, e.g. bars and legend dots
   *
   * @param rating Rating to get the class of
   */
  protected ratingClass(rating: SrsRating): "again" | "hard" | "good" {
    return rating === SrsRating.Again ? "again" : rating === SrsRating.Hard ? "hard" : "good";
  }

  /**
   * Label of a rating, matching the labels of the rating buttons of the review
   *
   * @param rating Rating to get the label of
   */
  protected ratingLabel(rating: SrsRating): string {
    return rating === SrsRating.Again ? "Don't know" : rating === SrsRating.Hard ? "Took a while" : "Got it";
  }

  /**
   * Percentage of an amount among all reviews of a card
   *
   * @param count Amount to get the percentage of
   * @param total Amount of reviews of the card
   */
  protected percent(count: number, total: number): string {
    if (total === 0) return "0%";
    return Math.round((count / total) * 100) + "%";
  }

  /**
   * Label of the current state of a card
   *
   * @param info Review information of the card
   */
  protected stateLabel(info: SrsCardReviewInfo): string {
    switch (info.state) {
      case SrsState.New: return "New";
      case SrsState.Learning: return "Learning";
      case SrsState.Review: return "Review";
      case SrsState.Relearning: return "Relearning";
      default: return "-";
    }
  }

  /**
   * Percentage of the reviews of a card that were not rated with "Don't know"
   *
   * @param info Review information of the card
   */
  protected retention(info: SrsCardReviewInfo): string {
    if (info.totalReviews === 0) return "-";
    return Math.round(((info.totalReviews - info.againCount) / info.totalReviews) * 100) + "%";
  }

  /**
   * Height of a bar of the review history chart in pixels, scaling with the
   * amount of days the reviewed card was scheduled into the future so that
   * the growth of the intervals becomes visible over time
   *
   * @param entry Review to get the height of the bar of
   * @param info Review information of the card the review belongs to
   */
  protected historyBarHeight(entry: SrsReviewHistoryEntry, info: SrsCardReviewInfo): number {
    const maxScheduledDays = info.history.reduce((max, e) => Math.max(max, e.scheduledDays), 1);
    return 8 + Math.round((entry.scheduledDays / maxScheduledDays) * 22);
  }

  /**
   * Horizontal offset of a bar of the review history chart, scaling with the
   * time of the review between the first and the last shown review of the card
   * so that every bar falls in line with its date; the offset leaves room for
   * the width of the bar, so the first bar starts at the left edge and the
   * last one ends at the right edge of the chart. A single review has no range
   * to scale into, so its bar is centered instead
   *
   * @param entry Review to get the offset of
   * @param info Review information of the card the review belongs to
   */
  protected historyBarLeft(entry: SrsReviewHistoryEntry, info: SrsCardReviewInfo): string {
    if (info.history.length === 1) {
      return "calc((100% - " + this.historyBarWidth + "px) * 0.5)";
    }

    const times = info.history.map((e) => new Date(e.review).getTime());
    const first = Math.min(...times);
    const span = Math.max(...times) - first;
    const fraction = span > 0 ? (new Date(entry.review).getTime() - first) / span : 0;
    return "calc((100% - " + this.historyBarWidth + "px) * " + fraction.toFixed(6) + ")";
  }

  /**
   * Staggered reveal delay of a bar of the review history chart in milliseconds
   *
   * @param index Index of the review within the history of the card
   */
  protected historyBarDelay(index: number): number {
    return Math.min(index * 15, 450);
  }

  /**
   * Tooltip of a bar of the review history chart
   *
   * @param entry Review to get the tooltip of
   * @param date Formatted date of the review, or null when it could not be formatted
   */
  protected historyTitle(entry: SrsReviewHistoryEntry, date: string | null): string {
    const scheduled = entry.scheduledDays === 0
      ? "back right away"
      : "back in " + this.humanizeDuration(entry.scheduledDays * 86400000);

    return (date ?? "") + " — " + this.ratingLabel(entry.rating) + " · " + scheduled;
  }
}
