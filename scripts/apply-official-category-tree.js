require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function generateId() {
  return 'cat_' + crypto.randomBytes(6).toString('hex');
}

const OFFICIAL_TREE = {
  "المنزل والمطبخ": ["أجهزة المطبخ الكهربائية", "أدوات الطهي والحلل", "أدوات المائدة والتقديم", "تنظيم وترتيب المطبخ والمنزل", "ديكور ومفروشات", "مستلزمات منزلية متنوعة"],
  "الإلكترونيات والتكنولوجيا": ["شواحن وكابلات وباور بانك", "محولات وفيش السفر", "سماعات وصوتيات", "ميكروفونات وأجهزة تسجيل", "كاميرات مراقبة وأنظمة أمان", "موبايلات وهواتف ذكية", "حوامل واكسسوارات الأجهزة"],
  "الأزياء والملابس": ["ملابس رجالية", "ملابس نسائية", "ملابس داخلية ولانجري", "جوارب وشرابات", "إكسسوارات ومثبتات الأزياء", "أحذية رياضية وكاجوال", "حقائب وشنط سفر"],
  "الصحة والجمال": ["العناية بالشعر", "العناية بالبشرة والجسم", "العطور والبرفانات", "أدوات ومستحضرات التجميل", "أجهزة العناية الشخصية"],
  "الرياضة واللياقة البدنية": ["أوزان ومعدات الجيم", "ملابس رياضية نسائية", "ملابس رياضية رجالية", "مستلزمات وأدوات التمارين"],
  "مستلزمات واكسسوارات السيارات": ["منظمات وحقائب السيارة", "حوامل الموبايل للسيارة", "العناية وتنظيف السيارات", "إلكترونيات وشواحن السيارات"],
  "أدوات ومستلزمات الطوارئ والسلامة": ["السلامة المهنية ومعدات الأمان", "الإسعافات الأولية", "أدوات طوارئ السيارات", "كشافات وطوارئ المنزل"],
  "ماي واي": ["عطور ماي واي", "مجموعات العناية بالجسم", "منظفات ومعطرات منزلية"],
  "المنتجات المكتبية ومستلزمات المدارس": ["طابعات وأحبار", "أقلام وأدوات كتابة", "دفاتر ومنظمات مكتبية"],
  "ألعاب وأنشطة الأطفال": ["ألعاب تعليمية وتنمية مهارات", "ألعاب ترفيهية ودمى"]
};

// Custom misplaced rules mapping: substring in title -> target subcategory
const MISPLACED_RULES = [
  { match: "لوازم خياطة", target: "مستلزمات منزلية متنوعة" },
  { match: "خزان الثلج", target: "مستلزمات منزلية متنوعة" },
  { match: "مقلاة هوائية", target: "أجهزة المطبخ الكهربائية" },
  { match: "قلاية", target: "أجهزة المطبخ الكهربائية" },
  { match: "فوطة", target: "العناية وتنظيف السيارات" },
  { match: "منظم سيارة ونظام تخزين بـ9 جيوب", target: "منظمات وحقائب السيارة" },
  { match: "محول قابس", target: "محولات وفيش السفر" },
  { match: "مجموعة فرش مكياج", target: "أدوات ومستحضرات التجميل" },
  { match: "جيبة رياضية", target: "ملابس رياضية نسائية" },
  { match: "سترة للمهندسين", target: "السلامة المهنية ومعدات الأمان" },
  { match: "شارمين ملابس داخلية", target: "ملابس داخلية ولانجري" },
  { match: "شرابات بطول يصل", target: "جوارب وشرابات" },
  { match: "شريط لاصق دابل فيس", target: "إكسسوارات ومثبتات الأزياء" },
  { match: "شريط لاصق شفاف جهتين", target: "إكسسوارات ومثبتات الأزياء" },
  { match: "حذاء رياضي", target: "أحذية رياضية وكاجوال" }
];

async function main() {
  console.log('1. Clearing old sections to rebuild the official tree...');
  const { error: deleteErr } = await supabase.from('sections').delete().neq('id', 'dummy'); // delete all
  if (deleteErr) console.log('Warning deleting sections:', deleteErr.message);

  let orderIndex = 1;
  const subcategoryIds = {};

  console.log('2. Inserting new tree into sections table...');
  for (const parent of Object.keys(OFFICIAL_TREE)) {
    const parentId = generateId();
    
    // Insert Parent
    await supabase.from('sections').insert({
      id: parentId,
      title: parent,
      category: parentId,
      type: 'products_by_category',
      enabled: true,
      order_index: orderIndex++,
      parent_id: null
    });

    // Insert Children
    for (const child of OFFICIAL_TREE[parent]) {
      const childId = generateId();
      subcategoryIds[child] = childId;
      
      await supabase.from('sections').insert({
        id: generateId(),
        title: child,
        category: childId,
        type: 'products_by_category',
        enabled: true,
        order_index: orderIndex++,
        parent_id: parentId
      });
    }
  }
  console.log('✅ Official Tree Created.');

  console.log('3. Fetching all products to reassign misplaced items...');
  const { data: products } = await supabase.from('products').select('id, title, category');
  
  if (!products) {
    console.log('No products found.');
    return;
  }

  let updatedCount = 0;
  for (const product of products) {
    let targetSubcategory = null;
    
    for (const rule of MISPLACED_RULES) {
      if (product.title.toLowerCase().includes(rule.match.toLowerCase())) {
        targetSubcategory = rule.target;
        break;
      }
    }

    if (targetSubcategory && subcategoryIds[targetSubcategory]) {
      const newCatId = subcategoryIds[targetSubcategory];
      if (product.category !== newCatId) {
        console.log(`Moving [${product.title.substring(0,40)}...] to ${targetSubcategory}`);
        await supabase.from('products').update({ category: newCatId }).eq('id', product.id);
        updatedCount++;
      }
    }
  }
  
  console.log(`✅ Reassigned ${updatedCount} products.`);
  
  console.log('4. Deleting duplicate categories...');
  const { error: delDupError } = await supabase.from('sections').delete().ilike('title', '%__DUPLICATE__%');
  
  console.log('\n--- PARENT MAPPINGS FOR HomepageProductGrid.tsx ---');
  const parentMappings = {};
  for (const parent of Object.keys(OFFICIAL_TREE)) {
    parentMappings[parent] = OFFICIAL_TREE[parent].map(child => subcategoryIds[child]);
  }
  console.log(JSON.stringify(parentMappings, null, 2));
  console.log('--------------------------------------------------\n');

  console.log('✅ Migration complete!');
}

main();
