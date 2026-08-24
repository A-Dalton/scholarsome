/**
 * Generates a random UUID (v4).
 *
 * `crypto.randomUUID()` is only available in a *secure context* (HTTPS or
 * `localhost`). When the app is served over a plain-HTTP LAN address (as is
 * common for the Docker build, e.g. `http://192.168.78.105:8082`), the API is
 * undefined, which crashes the caller. This helper falls back to a compliant
 * v4 UUID built with `crypto.getRandomValues`, which works in non-secure
 * contexts too.
 *
 * @returns A random UUID v4 string
 */
export function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // RFC 4122 v4 fallback: 16 random bytes, set the version (4) and variant bits.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    // Extremely unlikely to be needed (no Web Crypto at all), but keep it safe.
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
