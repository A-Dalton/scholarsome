/**
 * Returns whether the SSL environment variables are both populated, which is
 * the same condition the API uses to serve traffic over HTTPS directly
 *
 * @param sslKeyBase64 Value of the SSL_KEY_BASE64 environment variable
 * @param sslCertBase64 Value of the SSL_CERT_BASE64 environment variable
 *
 * @returns Whether the browser reaches the API over HTTPS
 */
export function sslEnabled(sslKeyBase64?: string | null, sslCertBase64?: string | null): boolean {
  return !!sslKeyBase64 && sslKeyBase64.length > 0 && !!sslCertBase64 && sslCertBase64.length > 0;
}

/**
 * Standard cookie attributes for Scholarsome's auth cookies
 *
 * `secure` should be enabled whenever the browser reaches the app over HTTPS,
 * so the cookies are never sent over a plain-HTTP connection. `sameSite: lax`
 * is set explicitly so behavior does not depend on browser defaults, and keeps
 * flows entered from email links (password reset, verification) working.
 *
 * @param secure Whether the browser reaches the app over HTTPS
 *
 * @returns Attributes to merge into every res.cookie() call
 */
export function cookieOptions(secure: boolean): { sameSite: "lax"; secure: boolean } {
  return { sameSite: "lax", secure };
}
