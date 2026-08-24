import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ApiResponse, ApiResponseOptions, CardMistake } from "@scholarsome/shared";
import { lastValueFrom } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class CardMistakesService {
  constructor(
    private readonly http: HttpClient
  ) {}

  /**
   * Makes a request to get all of the previous mistakes of the authenticated user
   *
   * @returns Array of `CardMistake` objects
   */
  async mistakes(): Promise<CardMistake[] | null> {
    let mistakes: ApiResponse<CardMistake[]> | undefined;

    try {
      mistakes = await lastValueFrom(this.http.get<ApiResponse<CardMistake[]>>("/api/card-mistakes"));
    } catch {
      return null;
    }

    if (mistakes.status === ApiResponseOptions.Success) {
      return mistakes.data;
    } else return null;
  }

  /**
   * Stores a card that the user did not know in progressive flashcards mode
   *
   * @param cardId ID of the card that was marked as unknown
   *
   * @returns Created `CardMistake` object or null on error
   */
  async createMistake(cardId: string): Promise<CardMistake | null> {
    let mistake: ApiResponse<CardMistake> | undefined;

    try {
      mistake = await lastValueFrom(this.http.post<ApiResponse<CardMistake>>("/api/card-mistakes", {
        cardId
      }));
    } catch {
      return null;
    }

    if (mistake.status === ApiResponseOptions.Success) {
      return mistake.data;
    } else return null;
  }
}
