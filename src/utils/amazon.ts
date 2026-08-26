import { Product } from '@/data/db';

export function getAmazonProductUrl(product: Product, trackingId: string): string {
  if (!product.originalUrl) {
    return '#';
  }

  // Use the original URL literally as the final Affiliate Link, as requested by the site owner.
  // We do not append or replace tracking tags, nor do we rebuild the URL.
  return product.originalUrl;
}
