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
   * Applies the theme by setting Bootstrap's native `data-bs-theme` attribute
   * on the document root element. Bootstrap 5.3+ supports dark mode out of the
   * box through this attribute, which lets the components/utilities adapt via
   * CSS variables. The choice is persisted in a cookie so it survives reloads.
   */
  applyTheme(theme: Theme): void {
    // persist the choice
    this.cookieService.set(this.themeCookie, theme);

    document.documentElement.setAttribute("data-bs-theme", theme);
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
