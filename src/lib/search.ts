import type { Product } from '@/data/db';

export const normalizeArabicSearch = (text: string) => {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Normalize Arabic letters
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    // Remove diacritics (tashkeel) if any
    .replace(/[\u064B-\u065F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
};

export const searchProducts = (products: Product[], query: string) => {
  if (!query) return [];
  const normalizedQuery = normalizeArabicSearch(query);
  
  if (!normalizedQuery) return [];

  return products.filter(p => {
    const title = normalizeArabicSearch(p.title);
    const category = p.category ? normalizeArabicSearch(p.category) : '';
    return title.includes(normalizedQuery) || category.includes(normalizedQuery);
  });
};
