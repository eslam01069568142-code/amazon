/**
 * Image Utility for Bkam El-Naharda
 * Converts low-resolution thumbnails from Amazon & Noon to high-resolution original URLs.
 */

export function getHighResImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  let cleaned = url.trim();
  
  // Amazon High-Res Cleaner:
  // Stripping parameters between dot-underscore (._) and final extension restores full resolution.
  if (cleaned.includes('media-amazon.com') || cleaned.includes('images-amazon.com') || cleaned.includes('amazon.eg') || cleaned.includes('amazon.')) {
    cleaned = cleaned.replace(/\._[A-Z0-9_,.-]+_\.([a-z0-9]+)/gi, '.$1');
  }

  // Noon High-Res Cleaner:
  // Upgrade Noon thumbnail widths (e.g. ?width=200) to full width (?width=1200).
  if (cleaned.includes('nooncdn.com')) {
    if (cleaned.includes('?width=')) {
      cleaned = cleaned.replace(/\?width=\d+/, '?width=1200');
    } else if (!cleaned.includes('?')) {
      cleaned += '?width=1200';
    }
  }

  return cleaned;
}

export function isLowResImage(url: string | null | undefined): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  // Check for common low-res Amazon thumbnail indicators
  if (lower.includes('_ac_sr') || lower.includes('_ac_us') || lower.includes('_sx38_') || lower.includes('_sy50_') || lower.includes('_ac_ul320_')) {
    return true;
  }
  // Check for small Noon thumbnails
  if (lower.includes('nooncdn.com') && lower.match(/\?width=(?:[1-4]\d\d|\d{1,2})$/)) {
    return true;
  }
  return false;
}
