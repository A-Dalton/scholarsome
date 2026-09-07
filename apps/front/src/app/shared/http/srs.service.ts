import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { ApiResponse, ApiResponseOptions, SrsQueueData, SrsRating, SrsReviewData } from "@scholarsome/shared";

@Injectable({
  providedIn: "root"
})
export class SrsService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Gets the review queue of a folder, including all cards scheduled for
   * review within the folder and recursively within its subfolders
   *
   * @param folderId ID of the folder to get the review queue of
   *
   * @returns `SrsQueueData` object
   */
  async queue(folderId: string): Promise<SrsQueueData | null> {
    let queue: ApiResponse<SrsQueueData> | undefined;

    try {
      queue = await lastValueFrom(this.http.get<ApiResponse<SrsQueueData>>("/api/srs/folders/" + folderId + "/queue"));
    } catch {
      return null;
    }

    if (queue.status === ApiResponseOptions.Success) {
      return queue.data;
    } else return null;
  }

  /**
   * Gets the full review queue across all folders of the authenticated user
   *
   * @returns `SrsQueueData` object
   */
  async queueAll(): Promise<SrsQueueData | null> {
    let queue: ApiResponse<SrsQueueData> | undefined;

    try {
      queue = await lastValueFrom(this.http.get<ApiResponse<SrsQueueData>>("/api/srs/queue"));
    } catch {
      return null;
    }

    if (queue.status === ApiResponseOptions.Success) {
      return queue.data;
    } else return null;
  }

  /**
   * Applies a rating to a card within the SRS
   *
   * @param cardId ID of the card to rate
   * @param rating Rating to apply to the card
   *
   * @returns `SrsReviewData` object
   */
  async rate(cardId: string, rating: SrsRating): Promise<SrsReviewData | null> {
    let review: ApiResponse<SrsReviewData> | undefined;

    try {
      review = await lastValueFrom(this.http.post<ApiResponse<SrsReviewData>>("/api/srs/review", {
        cardId,
        rating
      }));
    } catch {
      return null;
    }

    if (review.status === ApiResponseOptions.Success) {
      return review.data;
    } else return null;
  }
}
