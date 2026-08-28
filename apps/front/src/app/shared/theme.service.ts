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
   * How long (in days) the theme choice is remembered for. Chosen to outlive
   * typical login sessions (auth cookies last ~182 days).
   */
  private readonly themeCookieExpiryDays = 365;

  /**
   * Applies the theme by setting Bootstrap's native `data-bs-theme` attribute
   * on the document root element. Bootstrap 5.3+ supports dark mode out of the
   * box through this attribute, which lets the components/utilities adapt via
   * CSS variables. The choice is persisted in a cookie so it survives reloads.
   *
   * The cookie must be persistent (explicit `expires`), not a session cookie:
   * when the site is launched as a home-screen web app on iOS, session cookies
   * are discarded every time the web app is closed, which silently reset the
   * theme back to light on the next launch even while still signed in.
   */
  applyTheme(theme: Theme): void {
    // persist the choice
    this.cookieService.set(this.themeCookie, theme, {
      expires: this.themeCookieExpiryDays
    });

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
