require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Map Category Names to Keywords
const CATEGORY_RULES = [
  {
    name: 'المنزل والمطبخ',
    keywords: ['خزان ثلج', 'كولمان', 'خلاط', 'طاسة', 'صينية', 'مطبخ', 'أدوات منزلية', 'منظم مطبخ', 'كرسي', 'طاولة', 'مبرد', 'كوب', 'أكواب', 'فوطة', 'منشفة']
  },
  {
    name: 'الرياضة واللياقة',
    keywords: ['دامبل', 'أوزان', 'حبل قفز', 'بساط تمارين', 'جيم', 'لياقة', 'عضلات', 'تمرين', 'سجادة تمرين']
  },
  {
    name: 'الإلكترونيات',
    keywords: ['باور بانك', 'شاحن', 'كابل', 'سماعات', 'كاميرا', 'صوتيات', 'إلكترونيات', 'موبايل', 'شاشة', 'تلفزيون', 'لابتوب']
  },
  {
    name: 'الأزياء والموضة',
    keywords: ['ملابس', 'قميص', 'تيشيرت', 'حذاء', 'كوتشي', 'شنطة', 'حقيبة', 'شريط أزياء', 'بنطلون', 'جيبة', 'جاكيت']
  },
  {
    name: 'الصحة والجمال',
    keywords: ['عطور', 'برفان', 'عناية بالشعر', 'سيروم', 'ماسك', 'شامبو', 'بشرة', 'كريم', 'لوشن', 'فازلين', 'تقشير']
  },
  {
    name: 'ماي واي',
    keywords: ['ماي واي', 'my way']
  },
  {
    name: 'مستلزمات السيارات',
    keywords: ['حامل سيارة', 'منظف سيارات', 'إلكترونيات سيارات', 'معطر سيارة', 'للسيارة', 'عناية بالسيارة']
  },
  {
    name: 'المنتجات المكتبية',
    keywords: ['أقلام', 'ورق', 'طابعات', 'أدوات مكتبية', 'قلم']
  }
];

async function main() {
  console.log('Fetching active sections/categories...');
  const { data: sections, error: secError } = await supabase
    .from('sections')
    .select('id, category, title')
    .eq('enabled', true)
    .not('category', 'is', null);

  if (secError || !sections) {
    console.error('Failed to fetch sections:', secError);
    process.exit(1);
  }

  // Create a mapping of category name to category ID
  const catNameToId = {};
  const catIdToName = {};
  sections.forEach(s => {
    const id = s.category || s.id;
    catNameToId[s.title.trim()] = id;
    catIdToName[id] = s.title.trim();
  });

  console.log('Fetching all products...');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, title, category');

  if (prodError || !products) {
    console.error('Failed to fetch products:', prodError);
    process.exit(1);
  }

  const misplacedProducts = [];
  const updates = [];

  for (const product of products) {
    const currentCatId = product.category;
    const currentCatName = catIdToName[currentCatId] || 'Unknown';
    let targetCatName = null;

    // Check rules
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some(kw => product.title.toLowerCase().includes(kw.toLowerCase()))) {
        targetCatName = rule.name;
        break;
      }
    }

    if (targetCatName && targetCatName !== currentCatName) {
      const targetCatId = catNameToId[targetCatName];
      if (targetCatId && currentCatId !== targetCatId) {
        misplacedProducts.push({
          id: product.id,
          title: product.title.substring(0, 50) + '...',
          from: currentCatName,
          to: targetCatName,
          toId: targetCatId
        });
        updates.push({ id: product.id, targetCatId });
      }
    }
  }

  console.log(`\n🔍 Found ${misplacedProducts.length} misplaced products.\n`);
  
  if (misplacedProducts.length > 0) {
    console.table(misplacedProducts.map(p => ({
      'Title': p.title,
      'Current Category': p.from,
      'Correct Category': p.to
    })));

    console.log('\nApplying updates safely to Supabase...');
    let successCount = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from('products')
        .update({ category: update.targetCatId })
        .eq('id', update.id);
      
      if (error) {
        console.error(`Failed to update ${update.id}:`, error.message);
      } else {
        successCount++;
      }
    }
    console.log(`✅ Successfully updated ${successCount} products.`);
  }

  // Distribution report
  console.log('\n📊 Final Category Distribution:');
  const { data: finalProducts } = await supabase.from('products').select('category');
  const counts = {};
  finalProducts.forEach(p => {
    const name = catIdToName[p.category] || p.category || 'Uncategorized';
    counts[name] = (counts[name] || 0) + 1;
  });

  const distTable = Object.keys(counts).map(name => ({
    'Category': name,
    'Products': counts[name]
  })).sort((a, b) => b.Products - a.Products);
  
  console.table(distTable);
  process.exit(0);
}

main();
