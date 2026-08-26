const ADJECTIVES_TO_IGNORE = [
  'elegant', 'stylish', 'premium', 'beautiful', 'amazing', 'best', 'modern', 'trendy', 'luxury', 
  'أنيق', 'عصري', 'جذاب', 'جميل', 'فاخر', 'رائع', 'ممتاز', 'أفضل', 'حديث', 'new', 'cool', 'popular', 'gift', 'هدية', 'مميز', '2026'
];

const CATEGORY_MAP = [
  // Electronics
  { keywords: ['laptops', 'laptop', 'أجهزة كمبيوتر محمولة', 'كمبيوتر محمول', 'لابتوب', 'لابتوبات', 'notebooks', 'notebook'], child: 'لابتوبات وملحقاتها', parent: 'الإلكترونيات' },
  { keywords: ['mobile phones', 'cell phones', 'smartphones', 'mobile', 'هواتف خلوية', 'هواتف محمولة', 'موبايلات', 'هواتف ذكية'], child: 'الهواتف وملحقاتها', parent: 'الإلكترونيات' },
  { keywords: ['headphones', 'earbuds', 'earphones', 'wireless headphones', 'سماعات', 'سماعات أذن', 'سماعات لاسلكية', 'إيربودز'], child: 'السماعات والصوتيات', parent: 'الإلكترونيات' },
  { keywords: ['chargers', 'charging cables', 'cables', 'usb cables', 'شواحن', 'كابلات', 'أسلاك شحن', 'كابل usb'], child: 'الشواحن والكابلات', parent: 'الإلكترونيات' },
  { keywords: ['power banks', 'portable chargers', 'power bank', 'باور بانك', 'بنك طاقة', 'شاحن محمول'], child: 'الشحن والطاقة المحمولة', parent: 'الإلكترونيات' },
  { keywords: ['cameras', 'digital cameras', 'camera accessories', 'photography', 'cameras & photo', 'كاميرات', 'تصوير', 'إكسسوارات التصوير', 'tripod', 'camera bag', 'عدسات', 'حامل كاميرا'], child: 'الكاميرات والتصوير', parent: 'الإلكترونيات' },
  { keywords: ['smart watches', 'smartwatches', 'wearable technology', 'wearables', 'smartwatch', 'smart watch', 'fitness tracker', 'ساعات ذكية', 'أجهزة ذكية', 'سوار ذكي'], child: 'الساعات والأجهزة الذكية', parent: 'الإلكترونيات' },
  
  // Home & Kitchen
  { keywords: ['kitchen', 'kitchen & dining', 'cooking', 'cookware', 'kitchen tools', 'أدوات مطبخ', 'أدوات المطبخ', 'طبخ', 'أدوات الطبخ', 'أدوات المطبخ والطبخ', 'kitchen utensils'], child: 'أدوات المطبخ والطبخ', parent: 'المنزل والمطبخ' },
  { keywords: ['home appliances', 'appliances', 'أجهزة منزلية', 'أجهزة كهربائية منزلية'], child: 'الأجهزة المنزلية', parent: 'المنزل والمطبخ' },
  { keywords: ['home decor', 'decoration', 'ديكور', 'مفروشات'], child: 'ديكور ومفروشات', parent: 'المنزل والمطبخ' },
  { keywords: ['storage', 'organization', 'home organization', 'storage & organization', 'تنظيم', 'تخزين', 'تنظيم وتخزين'], child: 'تنظيم وتخزين', parent: 'المنزل والمطبخ' },

  // Beauty
  { keywords: ['skincare', 'skin care', 'facial care', 'العناية بالبشرة', 'العناية بالوجه'], child: 'العناية بالبشرة والجسم', parent: 'الصحة والجمال' },
  { keywords: ['hair care', 'haircare', 'hair styling', 'hair', 'العناية بالشعر', 'تصفيف الشعر'], child: 'العناية بالشعر', parent: 'الصحة والجمال' },
  { keywords: ['perfumes', 'fragrance', 'fragrances', 'perfume', 'عطور', 'عطر'], child: 'العطور', parent: 'الصحة والجمال' },
  { keywords: ['personal care devices', 'beauty devices', 'أجهزة العناية الشخصية'], child: 'أجهزة العناية الشخصية', parent: 'الصحة والجمال' },

  // Fashion
  { keywords: ["men's clothing", 'men clothing', 'ملابس رجالية'], child: 'ملابس رجالية', parent: 'الأزياء والموضة' },
  { keywords: ["women's clothing", 'women clothing', 'ملابس نسائية', 'فساتين', 'ملابس حريمي', 'dress'], child: 'ملابس نسائية', parent: 'الأزياء والموضة' },
  { keywords: ['shoes', 'footwear', 'أحذية'], child: 'أحذية', parent: 'الأزياء والموضة' },
  { keywords: ['bags', 'handbags', 'backpacks', 'fashion accessories', 'حقائب', 'شنط', 'إكسسوارات'], child: 'حقائب وإكسسوارات', parent: 'الأزياء والموضة' },

  // Sports
  { keywords: ['sports equipment', 'exercise equipment', 'أجهزة رياضية', 'معدات رياضية', 'gym'], child: 'أجهزة رياضية', parent: 'الالرياضة واللياقة' },
  { keywords: ['sportswear', 'sports clothing', 'ملابس رياضية'], child: 'ملابس رياضية', parent: 'الالرياضة واللياقة' },
  { keywords: ['outdoor', 'camping', 'hiking', 'أنشطة خارجية', 'تخييم'], child: 'مستلزمات الأنشطة الخارجية', parent: 'الالرياضة واللياقة' },

  // Toys
  { keywords: ['kids toys', 'dolls', 'ألعاب أطفال', 'دمى'], child: 'ألعاب أطفال ودمى', parent: 'الألعاب والترفيه' },
  { keywords: ['educational toys', 'learning toys', 'ألعاب تعليمية'], child: 'ألعاب تعليمية', parent: 'الألعاب والترفيه' },
  { keywords: ['video games', 'gaming', 'console games', 'ألعاب إلكترونية'], child: 'ألعاب إلكترونية', parent: 'الألعاب والترفيه' },
  { keywords: ['toys', 'ألعاب'], child: 'ألعاب أطفال ودمى', parent: 'الألعاب والترفيه' },

  // Office
  { keywords: ['office products', 'office supplies', 'school supplies', 'stationery', 'أدوات مكتبية', 'أدوات مدرسية', 'قرطاسية'], child: 'أدوات مكتبية ومدرسية', parent: 'المنتجات المكتبية' },
  { keywords: ['printers', 'printer accessories', 'طابعات', 'ملحقات الطابعات'], child: 'طابعات وملحقاتها', parent: 'المنتجات المكتبية' },
  
  // Automotive
  { keywords: ['car accessories', 'إكسسوارات السيارات'], child: 'إكسسوارات السيارات', parent: 'مستلزمات السيارات' },
  { keywords: ['car electronics', 'إلكترونيات السيارات'], child: 'إلكترونيات السيارات', parent: 'مستلزمات السيارات' },
  { keywords: ['car care', 'العناية بالسيارة'], child: 'العناية بالسيارة', parent: 'مستلزمات السيارات' },
  { keywords: ['emergency', 'أدوات ومستلزمات الطوارئ'], child: 'أدوات ومستلزمات الطوارئ', parent: 'مستلزمات السيارات' }
];

function removeAdjectives(text) {
  let cleaned = text.toLowerCase();
  ADJECTIVES_TO_IGNORE.forEach(adj => {
    const regex = new RegExp(`(?<![a-zA-Z\\u0600-\\u06FF])${adj}(?![a-zA-Z\\u0600-\\u06FF])`, 'gi');
    cleaned = cleaned.replace(regex, ' ');
  });
  return cleaned.replace(/\s+/g, ' ').trim();
}

function findCategory(textList) {
  for (const text of textList) {
    if (!text) continue;
    const cleaned = removeAdjectives(text);
    for (const mapping of CATEGORY_MAP) {
      if (mapping.keywords.some(kw => cleaned.includes(kw.toLowerCase()))) {
        return { parent: mapping.parent, child: mapping.child };
      }
    }
  }
  return null;
}

const tests = [
  { input: ['Elegant 20000mAh Power Bank'], expected: 'الشحن والطاقة المحمولة', label: 'Power Bank' },
  { input: ['Wireless Bluetooth Headphones'], expected: 'السماعات والصوتيات', label: 'Headphones' },
  { input: ['Gaming Laptop'], expected: 'لابتوبات وملحقاتها', label: 'Gaming Laptop' },
  { input: ["Women's Summer Dress"], expected: 'ملابس نسائية', label: "Women's Dress" },
  { input: ['Kitchen Cooking Utensils'], expected: 'أدوات المطبخ والطبخ', label: 'Kitchen Utensils' },
  { input: ['Some Random Unknown Thing'], expected: 'غير مصنف', label: 'Unknown Product' },
  { input: ['Luxury Beautiful Best Shoes 2026'], expected: 'أحذية', label: 'Marketing-heavy Product' },
];

console.log('| Test | Input                   | Expected               | Result |');
console.log('| ---- | ----------------------- | ---------------------- | ------ |');

tests.forEach((t, index) => {
  let result = findCategory(t.input);
  let child = result ? result.child : 'غير مصنف';
  let status = child === t.expected ? 'PASS' : 'FAIL';
  
  let inputPad = t.label.padEnd(23, ' ');
  let expPad = t.expected.padEnd(22, ' ');
  
  console.log(`| ${index+1}    | ${inputPad} | ${expPad} | ${status} |`);
  if(status === 'FAIL') {
      console.log(`FAILED on ${t.label}: Expected ${t.expected}, got ${child}`);
      process.exit(1);
  }
});
console.log('\\nAll tests passed successfully.');
