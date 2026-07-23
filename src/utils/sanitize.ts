/**
 * Sanitizes a URL string for safe injection into HTML template literals.
 * Strips characters that can break out of JS string contexts (backticks,
 * single-quotes, double-quotes, backslashes, angle brackets).
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/[`'"\\<>]/g, '');
}
