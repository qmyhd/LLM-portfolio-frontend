/**
 * Only let http(s) URLs reach an <a href>. News and filing links come from
 * third-party feeds via the backend; a `javascript:` or `data:` URL there
 * would run script when clicked.
 *
 *   <a href={safeExternalUrl(article.url) ?? '#'}>
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null; // relative or malformed: not an external link we trust
  }
}

/**
 * For <img src> of third-party images (avatars from a sign-in provider):
 * only an absolute https: URL passes. Everything else returns null.
 */
export function safeHttpsImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
