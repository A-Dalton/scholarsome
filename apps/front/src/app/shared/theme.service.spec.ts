import { TestBed } from "@angular/core/testing";
import { CookieService } from "ngx-cookie-service";

import { ThemeService } from "./theme.service";

describe("ThemeService", () => {
  let service: ThemeService;
  let cookieService: CookieService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeService, CookieService]
    });
    service = TestBed.inject(ThemeService);
    cookieService = TestBed.inject(CookieService);
    cookieService.deleteAll();
    document.documentElement.removeAttribute("data-bs-theme");
  });

  it("persists the theme in a cookie with an expiry so it survives iOS web app restarts", () => {
    const setSpy = jest.spyOn(cookieService, "set");

    service.applyTheme("dark");

    // a session cookie (no expiry) is discarded when iOS closes a
    // home-screen web app, silently resetting the theme.
    // (objectContaining: the library mutates the options object in place)
    expect(setSpy).toHaveBeenCalledWith(
      "scholarsome-theme",
      "dark",
      expect.objectContaining({ expires: expect.any(Number) })
    );
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe(
      "dark"
    );
  });

  it("defaults to light when no theme is stored", () => {
    expect(service.currentTheme()).toBe("light");
  });

  it("toggles between dark and light and persists each choice", () => {
    expect(service.toggle()).toBe("dark");
    expect(service.currentTheme()).toBe("dark");

    expect(service.toggle()).toBe("light");
    expect(service.currentTheme()).toBe("light");
  });
});
