/**
 * Helper module for Noon Affiliate URL Injection.
 * Isolated completely from Amazon tracking logic.
 */

export function buildNoonAffiliateUrl(originalUrl: string, noonTag: string): string {
  if (!originalUrl) return '';
  const cleanTag = (noonTag || 'AFF72733841fe2f').trim();
  if (!cleanTag) return originalUrl;

  try {
    let fullUrl = originalUrl.trim();
    if (!fullUrl) return '';

    // Protect Noon short links (e.g. s.noon.com or z.noon.com)
    const isShortLink = /(?:s\.noon|z\.noon)\.com/i.test(fullUrl);
    if (isShortLink) return fullUrl;

    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }

    const urlObj = new URL(fullUrl);
    // Strict isolation: apply tag ONLY if domain contains noon
    if (!urlObj.hostname.toLowerCase().includes('noon')) {
      return originalUrl;
    }

    // Set or override 'c' parameter for Noon affiliate tracking
    urlObj.searchParams.set('c', cleanTag);
    return urlObj.toString();
  } catch {
    return originalUrl;
  }
}
