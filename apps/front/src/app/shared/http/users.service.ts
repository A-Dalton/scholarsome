import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ApiResponse, ApiResponseOptions, User } from "@scholarsome/shared";
import { lastValueFrom } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class UsersService {
  constructor(
    private readonly http: HttpClient
  ) {}

  /**
   * Makes a request to find a unique user
   *
   * @param userId ID of the user to find
   *
   * @returns `User` object
   */
  async user(userId: string): Promise<User | null> {
    let user: ApiResponse<User> | undefined;

    try {
      user = await lastValueFrom(this.http.get<ApiResponse<User>>("/api/users/" + userId));
    } catch {
      return null;
    }

    if (user.status === ApiResponseOptions.Success) {
      return user.data;
    } else return null;
  }

  /**
   * Makes a request to get the authenticated user
   *
   * @returns `User` object
   */
  async myUser(): Promise<User | null> {
    let user: ApiResponse<User> | undefined;

    try {
      user = await lastValueFrom(this.http.get<ApiResponse<User>>("/api/users/me"));
    } catch {
      return null;
    }

    if (user.status === ApiResponseOptions.Success) {
      return user.data;
    } else return null;
  }

  /**
   * Gets a user avatar file
   *
   * @param width Optional, the returned width of the avatar
   * @param height Optional, the returned height of the avatar
   */
  async getMyAvatar(width?: number, height?: number): Promise<Blob | false> {
    let response;

    try {
      response = await lastValueFrom(
          this.http.get("/api/users/me/avatar" +
          "?width=" + (width ? width : "") +
          "&height=" + (height ? height : ""),
          { responseType: "blob" })
      );
    } catch {
      return false;
    }

    return response;
  }

  /**
   * Gets a user avatar file
   *
   * @param userId ID of the user. Endpoint will use ID in cookies if no ID is provided.
   * @param width Optional, the returned width of the avatar
   * @param height Optional, the returned height of the avatar
   */
  async getAvatar(userId: string, width?: number, height?: number): Promise<Blob | false> {
    let response;

    try {
      response = await lastValueFrom(
          this.http.get("/api/users/" + userId + "/avatar" +
         "?width=" + (width ? width : "") +
          "&height=" + (height ? height : ""),
          { responseType: "blob" })
      );
    } catch {
      return false;
    }

    return response;
  }

  /**
   * Uploads a user avatar
   *
   * @param avatar Image file
   *
   * @returns "success" if the avatar was uploaded, "tooLarge" if the image
   * exceeds the maximum size accepted by the API, "unsupported" if the image
   * is not a supported file type, and "error" for any other failure
   */
  async setMyAvatar(avatar: File): Promise<"success" | "tooLarge" | "unsupported" | "error"> {
    const formData = new FormData();
    formData.append("file", avatar);

    try {
      await lastValueFrom(this.http.post("/api/user/me/avatar", formData));
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        switch (e.status) {
          case 413:
            return "tooLarge";
          case 415:
            return "unsupported";
          default:
            return "error";
        }
      }

      return "error";
    }

    return "success";
  }

  /**
   * Deletes a user avatar
   *
   * @returns Boolean of whether the operation was successful
   */
  async deleteMyAvatar(): Promise<boolean> {
    try {
      await lastValueFrom(this.http.delete("/api/user/me/avatar"));
    } catch {
      return false;
    }

    return true;
  }
}
