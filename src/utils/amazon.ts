import { Product } from '@/data/db';

export function getAmazonProductUrl(product: Product, trackingId: string): string {
  if (!product.originalUrl) {
    return '#';
  }

  // Try to extract ASIN directly if it's already a full Amazon URL
  // Matches patterns like /dp/B0GMWTHDW7 or /product/B0GMWTHDW7
  const asinMatch = product.originalUrl.match(/\/(?:dp|product|ASIN)\/([A-Z0-9]{10})(?:\/|\?|$)/i);
  
  if (asinMatch && asinMatch[1]) {
    const asin = asinMatch[1].toUpperCase();
    if (trackingId) {
      return `https://www.amazon.eg/dp/${asin}?tag=${trackingId}`;
    }
    // If no trackingId is set yet, return a clean URL without any old tags
    return `https://www.amazon.eg/dp/${asin}`;
  }

  // If it's a shortlink or ASIN cannot be cleanly extracted, defer to the secure internal API proxy
  return `/api/go?id=${product.id}`;
}
