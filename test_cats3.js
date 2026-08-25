const RULES = [
  { name: 'سماعات وإكسسواراتها', keywords: ['سماعة', 'سماعات', 'earbuds', 'headphone', 'headset', 'earphone', 'airpods', 'soundcore', 'جراب سماعة', 'حافظة سماعة', 'airpods case', 'جراب ايربودز', 'جراب soundcore', 'جراب ساوند كور', 'حافظة سيليكون لسماعات', 'جراب سيليكون متوافق مع انكر', 'حافظة من السيليكون لسماعات', 'فري بودز', 'freebuds'], negative: [] },
  { name: 'أكسسوارات الموبايل', keywords: ['جراب موبايل', 'جراب هاتف', 'جراب ايفون', 'جراب سامسونج', 'حافظة هاتف', 'واقي شاشة للموبايل', 'كابل مخصص للهاتف', 'iphone', 'samsung'], negative: ['سماعة', 'سماعات', 'soundcore', 'airpods', 'earbuds'] },
  { name: 'إكسسوارات السيارات', keywords: ['سيارة', 'سيارات', 'شاحن سيارة', 'حامل موبايل للسيارة', 'مكنسة سيارة', 'car mount', 'car charger', 'car accessories'], negative: ['لعبة', 'أطفال', 'دفع', 'ركوب'] },
  { name: 'إكسسوارات التصوير', keywords: ['تصوير', 'tripod', 'كاميرا', 'اضاءة تصوير', 'رينج لايت', 'ميكروفون', 'lavalier', 'microphone', 'عصا سيلفي', 'سيلفي ستك', 'selfie stick', 'selfie tripod', 'حامل سيلفي', 'حامل ثلاثي للتصوير', 'حامل كاميرا', 'ثلاثي القوائم', 'سيلفي', 'camera accessories', 'photography accessories', 'selfie light', 'إضاءة سيلفي', 'camera light', 'photography light', 'video light', 'webcam', 'كاميرا ويب'], negative: ['سماعة', 'سماعات', 'earbuds', 'headphone', 'headset', 'earphone'] },
  { name: 'لابات وإكسسوارات', keywords: ['لاب', 'كمبيوتر', 'حاسوب', 'اكسسوارات كمبيوتر', 'ماوس', 'كيبورد', 'laptop', 'mouse', 'computer accessories', 'stand'], negative: ['ميكروفون', 'lavalier', 'microphone', 'webcam', 'كاميرا ويب', 'selfie light', 'إضاءة سيلفي'] },
  { name: 'المستلزمات الرياضية', keywords: ['نظارة موتوسيكل', 'موتوكروس', 'motocross', 'motorcycle goggles', 'cycling glasses', 'ski goggles', 'sports goggles', 'racing goggles', 'نظارات سباقات', 'نظارات الدراجات', 'نظارات التزلج', 'معدات رياضية', 'إكسسوارات رياضية'], negative: [] },
  { name: 'الصحة والجمال', keywords: ['صحة', 'جمال', 'تجميل', 'عناية', 'مكياج', 'شامبو', 'عطر', 'مزيل عرق', 'واقي', 'شمس', 'بشرة', 'skincare', 'beauty'], negative: [] },
  { name: 'أدوات منزلية', keywords: ['منزل', 'مطبخ', 'تنظيف', 'ديكور', 'أثاث', 'برطمان', 'علب', 'موزع مياه', 'مكيف', 'زيت', 'طبخ', 'طعام'], negative: [] },
  { name: 'فاشون', keywords: ['ملابس', 'أزياء', 'فاشون', 'موضة', 'حذاء', 'ساعة', 'نظارة', 'نظارات', 'قميص', 'بنطلون'], negative: ['موتوسيكل', 'دراجات', 'تزلج', 'سباقات', 'motocross', 'cycling', 'ski', 'sports'] },
  { name: 'دمى وألعاب', keywords: ['لعبة', 'ألعاب', 'أطفال', 'ركوب', 'لعب', 'سيارات أطفال'], negative: [] },
  { name: 'الإلكترونيات', keywords: ['تلفزيون', 'شاشة', 'رسيفر', 'باور بانك', 'إلكترونيات', 'موبايل', 'هاتف', 'بلوتوث'], negative: ['جراب', 'حافظة', 'ميكروفون', 'earbuds', 'شاحن سيارة', 'سماعة'] }
];

const tests = [
  "عصا سيلفي ثلاثية القوائم 3 في 1 بلوتوث",
  "إضاءة سيلفي للموبايل واللاب توب",
  "Ring Light for Laptop",
  "Lavalier Microphone for iPhone",
  "Laptop Stand",
  "Laptop Keyboard",
  "Bluetooth Speaker",
  "Bluetooth Receiver"
];

for (const t of tests) {
  let finalCat = '';
  const title = t.toLowerCase();
  for (const rule of RULES) {
    const hasPositive = rule.keywords.some(k => title.includes(k));
    const hasNegative = rule.negative.some(k => title.includes(k));
    if (hasPositive && !hasNegative) {
      finalCat = rule.name;
      break;
    }
  }
  console.log(`[${t}] -> ${finalCat}`);
}
