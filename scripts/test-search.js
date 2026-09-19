const {createClient}=require('@supabase/supabase-js');
require('dotenv').config({path:'.env.local'});
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const normalizeArabicSearch = (text) => {
  if (!text) return '';
  return text.trim().toLowerCase()
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ');
};

const searchProducts = (products, query) => {
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
       const isStandalone = new RegExp('(^|\\s)' + normalizedQuery + '(\\s|$)').test(combined);
       score += isStandalone ? 100 : 50;
    }

    // 2. Tokenized match
    if (queryTokens.length > 0) {
      let exactTokens = 0;
      let partialTokens = 0;
      let allTokensMatch = true;

      for (const token of queryTokens) {
        const isExact = new RegExp('(^|\\s)' + token + '(\\s|$)').test(combined);
        const isPartial = combined.includes(token);

        if (isExact) {
          exactTokens++;
        } else if (isPartial && token.length >= 4) {
          partialTokens++;
        } else {
          allTokensMatch = false;
          break;
        }
      }

      if (allTokensMatch) {
         score += (exactTokens * 10) + (partialTokens * 5);
      }
    }
    return { product: p, score };
  });

  return scoredProducts.filter(sp => sp.score > 0).sort((a, b) => b.score - a.score).map(sp => sp.product);
};

async function test() { 
  const {data}=await supabase.from('products').select('title, category, description'); 
  const products = data || []; 
  console.log('--- TEST 1: ماي واي ---'); 
  console.log(searchProducts(products, 'ماي واي').map(p=>p.title).join('\\n')); 
  console.log('\\n--- TEST 2: باور بانك ---'); 
  console.log(searchProducts(products, 'باور بانك').slice(0,3).map(p=>p.title).join('\\n')); 
  console.log('\\n--- TEST 3: عطر (1 word) ---'); 
  console.log(searchProducts(products, 'عطر').slice(0,3).map(p=>p.title).join('\\n')); 
  console.log('\\n--- TEST 4: English with Arabic (usb) ---'); 
  console.log(searchProducts(products, 'usb').slice(0,3).map(p=>p.title).join('\\n')); 
  console.log('\\n--- TEST 5: لابتوب (end of description) ---'); 
  console.log(searchProducts(products, 'لابتوب').slice(0,3).map(p=>p.title).join('\\n')); 
} 
test();
