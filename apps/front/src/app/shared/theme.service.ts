import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";

export type Theme = "light" | "dark";

@Injectable({
  providedIn: "root"
})
export class ThemeService {
  private readonly themeCookie = "scholarsome-theme";

  constructor(private readonly cookieService: CookieService) {}

  /**
   * Returns the currently active theme. Defaults to "light".
   */
  currentTheme(): Theme {
    const theme = this.cookieService.get(this.themeCookie);
    return theme === "dark" ? "dark" : "light";
  }

  /**
   * Applies the theme by toggling a `dark` class on the document root element.
   * The choice is persisted in a cookie so it survives page reloads.
   */
  applyTheme(theme: Theme): void {
    // persist the choice
    this.cookieService.set(this.themeCookie, theme);

    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  /**
   * Applies the theme that was previously stored. Called on startup.
   */
  initialize(): void {
    this.applyTheme(this.currentTheme());
  }

  /**
   * Toggles between dark and light, applying the new theme.
   */
  toggle(): Theme {
    const next: Theme = this.currentTheme() === "dark" ? "light" : "dark";
    this.applyTheme(next);
    return next;
  }
}
