const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: products } = await supabaseAdmin.from('products').select('*');
  const { data: existingCategories } = await supabaseAdmin.from('sections').select('id, title, category, type').eq('type', 'products_by_category');
  
  const categoryIdToName = new Map();
  if (existingCategories) {
    for (const cat of existingCategories) {
      if (cat.title) {
        categoryIdToName.set(cat.category, cat.title);
      }
    }
  }

  const RULES = [
    { name: 'سماعات وإكسسواراتها', keywords: ['سماعة', 'سماعات', 'earbuds', 'headphone', 'headset', 'earphone', 'airpods', 'soundcore', 'جراب سماعة', 'حافظة سماعة', 'airpods case', 'جراب ايربودز', 'جراب soundcore', 'جراب ساوند كور', 'حافظة سيليكون لسماعات', 'جراب سيليكون متوافق مع انكر', 'حافظة من السيليكون لسماعات', 'جراب موبايل سيليكون متوافق مع انكر साؤند كور r50i', 'جراب حماية من السيليكون دلـع موبايلك متوافقة مع سماعات', 'فري بودز', 'freebuds'], negative: [] },
    { name: 'أكسسوارات الموبايل', keywords: ['جراب موبايل', 'جراب هاتف', 'جراب ايفون', 'جراب سامسونج', 'حافظة هاتف', 'واقي شاشة للموبايل', 'كابل مخصص للهاتف', 'iphone', 'samsung'], negative: ['سماعة', 'سماعات', 'soundcore', 'airpods', 'earbuds'] },
    { name: 'إكسسوارات السيارات', keywords: ['سيارة', 'سيارات', 'شاحن سيارة', 'حامل موبايل للسيارة', 'مكنسة سيارة', 'car mount', 'car charger', 'car accessories'], negative: ['لعبة', 'أطفال', 'دفع', 'ركوب'] },
    { name: 'إكسسوارات التصوير', keywords: ['تصوير', 'tripod', 'كاميرا', 'اضاءة تصوير', 'رينج لايت', 'ميكروفون', 'lavalier', 'microphone'], negative: ['سماعة', 'سماعات', 'earbuds', 'headphone', 'headset', 'earphone'] },
    { name: 'لابات وإكسسوارات', keywords: ['لاب', 'كمبيوتر', 'حاسوب', 'اكسسوارات كمبيوتر', 'ماوس', 'كيبورد', 'laptop', 'mouse', 'computer accessories'], negative: ['ميكروفون', 'lavalier', 'microphone'] },
    { name: 'المستلزمات الرياضية', keywords: ['نظارة موتوسيكل', 'موتوكروس', 'motocross', 'motorcycle goggles', 'cycling glasses', 'ski goggles', 'sports goggles', 'racing goggles', 'نظارات سباقات', 'نظارات الدراجات', 'نظارات التزلج', 'معدات رياضية', 'إكسسوارات رياضية'], negative: [] },
    { name: 'الصحة والجمال', keywords: ['صحة', 'جمال', 'تجميل', 'عناية', 'مكياج', 'شامبو', 'عطر', 'مزيل عرق', 'واقي', 'شمس', 'بشرة', 'skincare', 'beauty'], negative: [] },
    { name: 'أدوات منزلية', keywords: ['منزل', 'مطبخ', 'تنظيف', 'ديكور', 'أثاث', 'برطمان', 'علب', 'موزع مياه', 'مكيف', 'زيت', 'طبخ', 'طعام'], negative: [] },
    { name: 'فاشون', keywords: ['ملابس', 'أزياء', 'فاشون', 'موضة', 'حذاء', 'ساعة', 'نظارة', 'نظارات', 'قميص', 'بنطلون'], negative: ['موتوسيكل', 'دراجات', 'تزلج', 'سباقات', 'motocross', 'cycling', 'ski', 'sports'] },
    { name: 'دمى وألعاب', keywords: ['لعبة', 'ألعاب', 'أطفال', 'ركوب', 'لعب', 'سيارات أطفال'], negative: [] },
    { name: 'الإلكترونيات', keywords: ['تلفزيون', 'شاشة', 'رسيفر', 'باور بانك', 'إلكترونيات', 'موبايل', 'هاتف', 'بلوتوث'], negative: ['جراب', 'حافظة', 'ميكروفون', 'earbuds', 'شاحن سيارة', 'سماعة'] }
  ];

  const results = [];
  
  for (const p of products) {
    const textToAnalyze = p.title.toLowerCase();
    
    let finalCategoryTitle = '';
    let reason = '';
    
    // Explicit workaround for poorly titled earbuds cases that contain both "جراب موبايل" and "soundcore"
    if (textToAnalyze.includes('جراب') && (textToAnalyze.includes('ساوند كور') || textToAnalyze.includes('soundcore') || textToAnalyze.includes('سماعات') || textToAnalyze.includes('سماعة') || textToAnalyze.includes('ايربودز') || textToAnalyze.includes('سماعة'))) {
      finalCategoryTitle = 'سماعات وإكسسواراتها';
      reason = 'Matched soundcore/earbuds specific case logic';
    } else {
      for (const rule of RULES) {
        const hasPositive = rule.keywords.some(k => textToAnalyze.includes(k));
        const hasNegative = rule.negative.some(k => textToAnalyze.includes(k));
        if (hasPositive && !hasNegative) {
          finalCategoryTitle = rule.name;
          reason = 'Matched rule: ' + rule.name;
          break;
        }
      }
    }
    
    let currentName = categoryIdToName.get(p.category) || p.category;
    // Map existing old names to new ones if no intelligent rule matches
    if (!finalCategoryTitle) {
       if (currentName === 'السماعات' || currentName === 'جرابات السماعات') {
         finalCategoryTitle = 'سماعات وإكسسواراتها';
         reason = 'Legacy mapped';
       } else if (currentName === 'جرابات الموبايل') {
         finalCategoryTitle = 'أكسسوارات الموبايل';
         reason = 'Legacy mapped';
       } else {
         finalCategoryTitle = currentName;
         reason = 'No match, kept original';
       }
    }
    
    results.push({
      id: p.id,
      title: p.title,
      current: currentName,
      recommended: finalCategoryTitle,
      reason: reason
    });
  }
  
  console.log(JSON.stringify(results, null, 2));
}

run();
