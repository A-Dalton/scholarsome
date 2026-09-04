/**
 * Syncs the Handbook theme with the theme cookie used by the Scholarsome
 * front-end.
 *
 * The front-end stores the user's choice in a `scholarsome-theme` cookie
 * ("light" | "dark", see ThemeService in apps/front) and applies it as
 * Bootstrap's `data-bs-theme` attribute. Docusaurus controls dark mode with
 * its own `data-theme` attribute and persists the choice in localStorage.
 *
 * This plugin injects an inline <head> script that runs before Docusaurus'
 * theme bootstrap script (injected at the top of <body>), so the cookie is
 * applied before first paint:
 *   - the cookie value is written into Docusaurus' localStorage slot, which
 *     its bootstrap script then applies
 *   - no cookie => the slot is cleared so Docusaurus applies its default
 *
 * It also mirrors theme changes made through the Handbook's color mode toggle
 * back into the cookie, so the cookie remains the single source of truth and
 * the front-end picks up the choice on its next load.
 */

const THEME_COOKIE = "scholarsome-theme";
// Must match ThemeService in the front-end so the cookie is overwritten, not duplicated.
const THEME_COOKIE_EXPIRY_DAYS = 365;

// Docusaurus' color mode storage slot: `theme` + empty namespace.
const STORAGE_KEY = "theme";

const inlineScript = `
(function () {
  var COOKIE = "${THEME_COOKIE}";
  var EXPIRY_DAYS = ${THEME_COOKIE_EXPIRY_DAYS};
  var STORAGE_KEY = "${STORAGE_KEY}";

  function readCookie() {
    var match = document.cookie.match(new RegExp("(?:^|; )" + COOKIE + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function writeCookie(value) {
    var expires = new Date(Date.now() + EXPIRY_DAYS * 86400000).toUTCString();
    document.cookie = COOKIE + "=" + encodeURIComponent(value) + "; Expires=" + expires + "; Path=/; SameSite=Lax";
  }

  try {
    var theme = readCookie();
    if (theme === "dark" || theme === "light") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {}

  try {
    var lastTheme = null;
    new MutationObserver(function () {
      var theme = document.documentElement.getAttribute("data-theme");
      if ((theme === "dark" || theme === "light") && theme !== lastTheme) {
        lastTheme = theme;
        writeCookie(theme);
      }
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
  } catch (err) {}
})();
`;

module.exports = function scholarsomeThemePlugin() {
  return {
    name: "scholarsome-theme-cookie-sync",
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: "script",
            innerHTML: inlineScript,
          },
        ],
      };
    },
  };
};
