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

  const scoredProducts = products.map(p => {
    const title = normalizeArabicSearch(p.title);
    const category = p.category ? normalizeArabicSearch(p.category) : '';
    const description = p.description ? normalizeArabicSearch(p.description) : '';
    const combined = `${title} ${category} ${description}`;

    let score = 0;

    // 1. Exact phrase match
    if (combined.includes(normalizedQuery)) {
       const isStandalone = new RegExp(`(^|\\s)${normalizedQuery}(\\s|$)`).test(combined);
       score += isStandalone ? 100 : 50;
    }

    // 2. Tokenized match
    if (queryTokens.length > 0) {
      let exactTokens = 0;
      let partialTokens = 0;
      let allTokensMatch = true;

      for (const token of queryTokens) {
        const isExact = new RegExp(`(^|\\s)${token}(\\s|$)`).test(combined);
        const isPartial = combined.includes(token);

        if (isExact) {
          exactTokens++;
        } else if (isPartial && token.length >= 4) {
          // Allow substring matches only for tokens of length >= 4
          // to prevent short tokens (like "ماي", "واي") from false positives 
          // inside completely unrelated words (like "مايكرو", "وايفون").
          partialTokens++;
        } else {
          allTokensMatch = false;
          break; // Optimization: if one token fails, the whole search fails
        }
      }

      if (allTokensMatch) {
         score += (exactTokens * 10) + (partialTokens * 5);
      }
    }

    return { product: p, score };
  });

  return scoredProducts
    .filter(sp => sp.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(sp => sp.product);
};
