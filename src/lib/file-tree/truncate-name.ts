/**
 * Truncate an over-long filename for display while keeping its extension,
 * so a 150-character name renders as `start…name.ext` rather than being
 * clipped mid-word with the extension lost.
 *
 * - Names at or under `max` are returned unchanged.
 * - The extension is the text after the last dot, but only when that dot
 *   isn't the first character (so dotfiles like `.gitignore` are treated
 *   as having no extension) and isn't the trailing character.
 * - Extensionless and dotfile names are truncated with a trailing ellipsis
 *   and no preserved suffix.
 *
 * The full name should still be exposed elsewhere (e.g. a `title`
 * attribute) so nothing is lost to a reader who wants it.
 */

const ELLIPSIS = '…';

export function truncateFileName(name: string, max = 100): string {
  if (name.length <= max) return name;

  const lastDot = name.lastIndexOf('.');
  const hasExtension = lastDot > 0 && lastDot < name.length - 1;
  const ext = hasExtension ? name.slice(lastDot) : '';

  const keep = max - ELLIPSIS.length - ext.length;

  // Pathological: the extension alone is ~as long as the budget. Fall back
  // to a plain head truncation so we never return more than ~max chars.
  if (keep < 1) {
    return name.slice(0, Math.max(1, max - ELLIPSIS.length)) + ELLIPSIS;
  }

  return name.slice(0, keep) + ELLIPSIS + ext;
}
