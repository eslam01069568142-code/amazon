/**
 * BKAM EL NAHARDA — Core Price Engine & Parsing Utilities
 * Safe numeric price extraction, formatting, and savings calculation.
 */

export interface UnifiedOffer {
  id: string;
  storeName: string;
  price: number | null;
  rawPrice?: string;
  currency: string;
  originalPrice?: number | null;
  rawOriginalPrice?: string;
  url: string;
}

/**
 * Parses any price string or number into a clean positive numeric value.
 * Supports:
 * - Eastern Arabic numerals (٠-٩) and Western numerals (0-9).
 * - Thousands separators (commas, spaces, Arabic thousands separators '٬').
 * - Decimal points (period '.', comma ',').
 * - Currency text (ج.م, EGP, جنيه, L.E, etc.).
 *
 * Strict Rule: Returns null if the price cannot be verified as a valid positive number.
 * NEVER converts an invalid or missing price into 0.
 */
export function parseNumericPrice(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return isNaN(input) || input <= 0 ? null : input;
  }

  let str = String(input).trim();
  if (!str) return null;

  // Convert Eastern Arabic numerals (٠-٩) to Western (0-9)
  const easternArabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(easternArabicDigits[i], 'g'), String(i));
  }

  // Remove common currency labels in Arabic and English
  str = str.replace(/(?:EGP|LE|L\.E|ج\.م|جنيه|جنبه|جنيهات|EGP\.?)/gi, '');

  // Handle number formats: e.g. "5,999.00" or "5.999,00" or "5 999"
  // First, strip spaces and Arabic thousands separators
  str = str.replace(/[\s٬]/g, '');

  // If there are both comma and dot, figure out which one is the decimal separator
  if (str.includes(',') && str.includes('.')) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastDot > lastComma) {
      // e.g. 5,999.50 -> remove comma
      str = str.replace(/,/g, '');
    } else {
      // e.g. 5.999,50 -> remove dot, replace comma with dot
      str = str.replace(/\./g, '').replace(',', '.');
    }
  } else if (str.includes(',')) {
    // Check if comma is decimal (followed by exactly 2 digits at end) or thousands separator
    if (/,\d{2}$/.test(str)) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }

  // Extract valid floating point number pattern
  const match = str.match(/\d+(?:\.\d+)?/);
  if (!match) return null;

  const num = parseFloat(match[0]);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Formats a numeric price cleanly for display in EGP.
 */
export function formatDisplayPrice(priceNum: number | null, rawFallback?: string): string {
  if (priceNum === null || priceNum === undefined || priceNum <= 0) {
    if (rawFallback && rawFallback.trim()) {
      const parsed = parseNumericPrice(rawFallback);
      if (parsed !== null && parsed > 0) {
        return `${parsed.toLocaleString('en-US')} ج.م`;
      }
    }
    return 'السعر غير متوفر حاليًا';
  }
  return `${priceNum.toLocaleString('en-US')} ج.م`;
}

/**
 * Calculates store-to-store savings and original price discounts.
 * Strictly separates:
 * 1. Best Price (lowest valid offer)
 * 2. Store-to-Store Savings (difference between lowest & 2nd lowest offer)
 * 3. Original-Price Discount (difference between current price & original list price)
 */
export function calculateSavings(offers: UnifiedOffer[]) {
  const validOffers = offers
    .filter(o => o.price !== null && o.price > 0)
    .sort((a, b) => a.price! - b.price!);

  if (validOffers.length === 0) {
    return {
      bestOffer: null,
      storeSavings: null,
      isMultipleOffers: false,
    };
  }

  const bestOffer = validOffers[0];
  let storeSavings: { amount: number; percent: number; comparedStore: string } | null = null;

  if (validOffers.length >= 2) {
    const secondOffer = validOffers[1];
    if (secondOffer.price! > bestOffer.price!) {
      const diff = secondOffer.price! - bestOffer.price!;
      const percent = Math.round((diff / secondOffer.price!) * 1000) / 10;
      storeSavings = {
        amount: Math.round(diff),
        percent,
        comparedStore: secondOffer.storeName || 'المتجر الآخر',
      };
    }
  }

  return {
    bestOffer,
    storeSavings,
    isMultipleOffers: validOffers.length > 1,
  };
}

/**
 * Calculates original price discount percentage safely.
 */
export function calculateOriginalDiscount(currentPrice: number | null, originalPrice: number | null): number | null {
  if (!currentPrice || !originalPrice || originalPrice <= currentPrice) {
    return null;
  }
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}
