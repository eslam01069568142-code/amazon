const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fetching products and categories...");
  const { data: products, error: pErr } = await supabaseAdmin.from('products').select('*');
  if (pErr) throw pErr;
  
  const { data: existingCategories, error: cErr } = await supabaseAdmin.from('sections').select('id, title, category, type').eq('type', 'products_by_category');
  if (cErr) throw cErr;
  
  const categoryIdToName = new Map();
  const categoryNameToId = new Map();
  
  if (existingCategories) {
    for (const cat of existingCategories) {
      if (cat.title) {
        const normalized = cat.title.trim().toLowerCase().replace(/\s+/g, ' ');
        categoryIdToName.set(cat.category, cat.title);
        categoryNameToId.set(normalized, cat.category);
      }
    }
  }

  const RULES = [
    { name: 'جرابات السماعات', keywords: ['جراب سماعة', 'حافظة سماعة', 'airpods case', 'جراب ايربودز', 'جراب soundcore', 'جراب ساوند كور', 'حافظة سيليكون لسماعات', 'جراب سيليكون متوافق مع انكر', 'حافظة من السيليكون لسماعات', 'جراب موبايل سيليكون متوافق مع انكر साؤند كور r50i', 'جراب حماية من السيليكون دلـع موبايلك متوافقة مع سماعات'], negative: [] },
    { name: 'جرابات الموبايل', keywords: ['جراب موبايل', 'جراب هاتف', 'جراب ايفون', 'جراب سامسونج', 'حافظة هاتف'], negative: ['سماعة', 'سماعات', 'soundcore', 'airpods'] },
    { name: 'إكسسوارات السيارات', keywords: ['سيارة', 'سيارات', 'شاحن سيارة', 'حامل موبايل للسيارة', 'مكنسة سيارة', 'car mount', 'car charger', 'car accessories'], negative: ['لعبة', 'أطفال', 'دفع', 'ركوب'] },
    { name: 'إكسسوارات التصوير', keywords: ['تصوير', 'tripod', 'كاميرا', 'اضاءة تصوير', 'رينج لايت', 'ميكروفون', 'lavalier', 'microphone'], negative: ['سماعة', 'سماعات', 'earbuds', 'headphone', 'headset', 'earphone'] },
    { name: 'السماعات', keywords: ['سماعة', 'سماعات', 'earbuds', 'headphone', 'headset', 'earphone', 'airpods', 'soundcore'], negative: ['جراب', 'حافظة', 'غطاء', 'كفر', 'case', 'سيليكون'] },
    { name: 'لابات وإكسسوارات', keywords: ['لاب', 'كمبيوتر', 'حاسوب', 'اكسسوارات كمبيوتر', 'ماوس', 'كيبورد', 'laptop', 'mouse', 'computer accessories'], negative: ['ميكروفون', 'lavalier', 'microphone'] },
    { name: 'المستلزمات الرياضية', keywords: ['نظارة موتوسيكل', 'موتوكروس', 'motocross', 'motorcycle goggles', 'cycling glasses', 'ski goggles', 'sports goggles', 'racing goggles', 'نظارات سباقات', 'نظارات الدراجات', 'نظارات التزلج', 'معدات رياضية', 'إكسسوارات رياضية'], negative: [] },
    { name: 'الصحة والجمال', keywords: ['صحة', 'جمال', 'تجميل', 'عناية', 'مكياج', 'شامبو', 'عطر', 'مزيل عرق', 'واقي', 'شمس', 'بشرة', 'skincare', 'beauty'], negative: [] },
    { name: 'أدوات منزلية', keywords: ['منزل', 'مطبخ', 'تنظيف', 'ديكور', 'أثاث', 'برطمان', 'علب', 'موزع مياه', 'مكيف', 'زيت', 'طبخ', 'طعام'], negative: [] },
    { name: 'فاشون', keywords: ['ملابس', 'أزياء', 'فاشون', 'موضة', 'حذاء', 'ساعة', 'نظارة', 'نظارات', 'قميص', 'بنطلون'], negative: ['موتوسيكل', 'دراجات', 'تزلج', 'سباقات', 'motocross', 'cycling', 'ski', 'sports'] },
    { name: 'دمى وألعاب', keywords: ['لعبة', 'ألعاب', 'أطفال', 'ركوب', 'لعب', 'سيارات أطفال'], negative: [] },
    { name: 'الإلكترونيات', keywords: ['تلفزيون', 'شاشة', 'رسيفر', 'باور بانك', 'إلكترونيات', 'موبايل', 'هاتف', 'بلوتوث'], negative: ['جراب', 'حافظة', 'ميكروفون', 'earbuds', 'شاحن سيارة', 'سماعة'] }
  ];

  const results = [];
  let changedCount = 0;
  let unchangedCount = 0;
  let createdCategories = 0;
  
  for (const p of products) {
    const textToAnalyze = p.title.toLowerCase();
    
    let finalCategoryTitle = '';
    
    if (textToAnalyze.includes('جراب') && (textToAnalyze.includes('ساوند كور') || textToAnalyze.includes('soundcore') || textToAnalyze.includes('سماعات') || textToAnalyze.includes('سماعة') || textToAnalyze.includes('ايربودز'))) {
      finalCategoryTitle = 'جرابات السماعات';
    } else {
      for (const rule of RULES) {
        const hasPositive = rule.keywords.some(k => textToAnalyze.includes(k));
        const hasNegative = rule.negative.some(k => textToAnalyze.includes(k));
        if (hasPositive && !hasNegative) {
          finalCategoryTitle = rule.name;
          break;
        }
      }
    }
    
    const currentName = categoryIdToName.get(p.category) || p.category;
    
    if (!finalCategoryTitle) {
      finalCategoryTitle = currentName; // Fallback
    }
    
    if (finalCategoryTitle !== currentName) {
      // It needs changing
      let targetCategoryId = categoryNameToId.get(finalCategoryTitle.toLowerCase());
      
      // If category doesn't exist, create it
      if (!targetCategoryId) {
        console.log(`Creating missing category: ${finalCategoryTitle}`);
        const newCatId = 'cat_' + Math.random().toString(36).substr(2, 9);
        const newSectionId = 'sec_' + Math.random().toString(36).substr(2, 9);
        await supabaseAdmin.from('sections').insert({
          id: newSectionId, type: 'products_by_category', category: newCatId, title: finalCategoryTitle, enabled: true, order_index: 99
        });
        targetCategoryId = newCatId;
        categoryNameToId.set(finalCategoryTitle.toLowerCase(), newCatId);
        categoryIdToName.set(newCatId, finalCategoryTitle);
        createdCategories++;
      }
      
      console.log(`[UPDATE] ${p.title.substring(0,30)}... | ${currentName} -> ${finalCategoryTitle}`);
      
      // Actual UPDATE
      await supabaseAdmin.from('products').update({ category: targetCategoryId }).eq('id', p.id);
      
      changedCount++;
    } else {
      unchangedCount++;
    }
  }
  
  console.log('--- RE-CATEGORIZATION COMPLETE ---');
  console.log(`Total Products: ${products.length}`);
  console.log(`Changed: ${changedCount}`);
  console.log(`Unchanged: ${unchangedCount}`);
  console.log(`Categories Created: ${createdCategories}`);
}

run().catch(console.error);
