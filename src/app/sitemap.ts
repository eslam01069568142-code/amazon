import { MetadataRoute } from 'next';
import { getDb } from '@/data/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb();
  
  const baseUrl = 'https://bkamelnaharda.vercel.app';
  
  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    }
  ];

  // Add categories
  const categories = new Set(db.products.map((p) => p.category).filter(Boolean));
  categories.forEach((category) => {
    sitemapEntries.push({
      url: `${baseUrl}/?category=${encodeURIComponent(category)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    });
  });

  // Add products
  db.products.forEach((product) => {
    // try to parse the createdAt if valid, otherwise use current date
    let lastMod = new Date();
    try {
      if (product.createdAt) {
         const parsed = new Date(product.createdAt);
         if (!isNaN(parsed.getTime())) lastMod = parsed;
      }
    } catch(e) {}

    sitemapEntries.push({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  // Add static pages
  ['about', 'contact', 'privacy', 'terms', 'shipping', 'return'].forEach((page) => {
    sitemapEntries.push({
      url: `${baseUrl}/${page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    });
  });

  return sitemapEntries;
}
