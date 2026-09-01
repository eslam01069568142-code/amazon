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
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // Remove diacritics (tashkeel)
    .replace(/[\u064B-\u065F]/g, '')
    // Remove punctuation
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
};

export const searchProducts = (products: Product[], query: string) => {
  if (!query) return [];
  const normalizedQuery = normalizeArabicSearch(query);
  if (!normalizedQuery) return [];

  const queryTokens = normalizedQuery.split(' ').filter(t => t.length > 0);

  return products.filter(p => {
    const title = normalizeArabicSearch(p.title);
    const category = p.category ? normalizeArabicSearch(p.category) : '';
    const description = p.description ? normalizeArabicSearch(p.description) : '';
    const combined = `${title} ${category} ${description}`;

    // Direct match
    if (combined.includes(normalizedQuery)) return true;

    // Tokenized match (all search tokens present in product text)
    if (queryTokens.length > 1) {
      return queryTokens.every(token => combined.includes(token));
    }

    return false;
  });
};
