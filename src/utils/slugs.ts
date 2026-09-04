/**
 * Generates a URL-friendly slug from a string, supporting Arabic characters.
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove characters that are not letters (Arabic/English), numbers, or hyphens
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Remove leading or trailing hyphens
    .replace(/^-+|-+$/g, '');
}
