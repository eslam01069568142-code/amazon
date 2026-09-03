const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function getHighResImageUrl(url) {
  if (!url) return '';
  let cleaned = String(url).trim();
  
  if (cleaned.includes('media-amazon.com') || cleaned.includes('images-amazon.com') || cleaned.includes('amazon.')) {
    cleaned = cleaned.replace(/\._[A-Z0-9_,.+%-]+_\.([a-z0-9]+)$/gi, '.$1');
    cleaned = cleaned.replace(/\.([A-Z0-9_,-]+)\.(jpg|png|jpeg|webp)$/gi, (match, p1, ext) => {
      if (p1.includes('AC') || p1.includes('SR') || p1.includes('US') || p1.includes('SX') || p1.includes('SY') || p1.includes('UL') || p1.includes('SL') || p1.includes('CR')) {
        return '.' + ext;
      }
      return match;
    });
  }

  if (cleaned.includes('nooncdn.com')) {
    if (cleaned.includes('?width=')) {
      cleaned = cleaned.replace(/\?width=\d+/, '?width=1200');
    } else if (!cleaned.includes('?')) {
      cleaned += '?width=1200';
    }
  }

  return cleaned;
}

async function safeQuery(queryFn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await queryFn();
      if (!res.error) return res;
      console.warn(`Query attempt ${attempt} returned error:`, res.error.message);
    } catch (e) {
      console.warn(`Query attempt ${attempt} failed:`, e.message);
    }
    await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  return { data: null, error: new Error('Max retries exceeded') };
}

async function fixCatalogData() {
  console.log("=================================================");
  console.log("STARTING DB RE-CATEGORIZATION & HIGH-RES IMAGE UPDATE");
  console.log("=================================================");

  // 1. Fetch available category sections from Supabase with retries
  const { data: sections, error: sErr } = await safeQuery(() => 
    supabase.from('sections').select('id, category, title').eq('type', 'products_by_category')
  );

  if (sErr || !sections) {
    console.error("Failed to fetch sections:", sErr);
    return;
  }

  console.log("AVAILABLE SECTION CATEGORIES IN SYSTEM:");
  sections.forEach(s => console.log(` - ID: ${s.category} | Title: "${s.title}"`));

  // Map system categories to target section IDs
  const findTargetCatId = (keywords, defaultId) => {
    for (const kw of keywords) {
      const match = sections.find(s => s.title.includes(kw) || s.category.includes(kw));
      if (match) return match.category;
    }
    return defaultId;
  };

  const fashionCatId = findTargetCatId(['الأزياء', 'موضة', 'ملابس'], sections[0]?.category);
  const shoesCatId = findTargetCatId(['أحذية', 'الأحذية'], fashionCatId);
  const bagsCatId = findTargetCatId(['حقائب', 'شنط'], fashionCatId);
  const beautyCatId = findTargetCatId(['جمال', 'عناية', 'بشرة'], sections[0]?.category);
  const appliancesCatId = findTargetCatId(['أجهزة', 'مطبخ', 'منزل'], sections[0]?.category);
  const electronicsCatId = findTargetCatId(['إلكترونيات', 'موبايل'], sections[0]?.category);

  console.log("\nDERIVED CATEGORY TARGETS:");
  console.log(" - Fashion:", fashionCatId);
  console.log(" - Shoes:", shoesCatId);
  console.log(" - Bags:", bagsCatId);
  console.log(" - Beauty:", beautyCatId);
  console.log(" - Appliances:", appliancesCatId);
  console.log(" - Electronics:", electronicsCatId);

  // 2. Fetch all products from Supabase
  const { data: products, error: pErr } = await safeQuery(() =>
    supabase.from('products').select('*')
  );
  if (pErr || !products) {
    console.error("Failed to fetch products:", pErr);
    return;
  }

  console.log(`\nFETCHED ${products.length} TOTAL PRODUCTS FROM SUPABASE`);

  let categoriesUpdated = 0;
  let imagesUpdated = 0;

  for (const p of products) {
    const titleLower = (p.title + ' ' + (p.description || '')).toLowerCase();
    let newCategory = p.category;
    let needsUpdate = false;
    const updates = {};

    // Check if re-categorization is needed (especially for generic IDs or miscategorized items)
    // Keywords detection:
    if (titleLower.match(/(حذاء|كوتشي|اديداس|سنيكرز|صندل|أحذية|shoes|sneakers)/i)) {
      newCategory = shoesCatId;
    } else if (titleLower.match(/(شنطة|حقيبة|حقائب|رحالا|لاب توب|ظهر|كروس|bag|backpack)/i)) {
      newCategory = bagsCatId;
    } else if (titleLower.match(/(قميص|تيشرت|تي شيرت|بوكسر|فانلة|شرابات|حمالة صدر|بنطلون|جينز|ملابس|بلوزة|ترنج|فستان|جاكيت|دايس|شارمين|ال سي وايكيكي|موباكو|وايت ايجل|shirt|pants|underwear|socks)/i)) {
      newCategory = fashionCatId;
    } else if (titleLower.match(/(بشرة|عناية|عطر|سيليكون|غسول|شامبو|صابون|حلاقة|جمال|skincare|perfume|beauty)/i)) {
      newCategory = beautyCatId;
    } else if (titleLower.match(/(مطبخ|قهوة|تكييف|كارير|فيليبس|أجهزة|خلاط|غلاية|appliance|kitchen|coffee)/i)) {
      newCategory = appliancesCatId;
    } else if (titleLower.match(/(هاتف|موبايل|سامسونج|آيفون|شاومي|سماعة|لابتوب|شاحن|باور بانك|إلكترونيات|mobile|laptop|phone)/i)) {
      newCategory = electronicsCatId;
    }

    if (newCategory && newCategory !== p.category) {
      updates.category = newCategory;
      needsUpdate = true;
      categoriesUpdated++;
      console.log(`[RE-CATEGORY] Product ${p.id}: "${p.title.substring(0, 45)}" -> Category: '${newCategory}' (was '${p.category}')`);
    }

    // High-Res Image Upgrade
    const highResMain = getHighResImageUrl(p.image);
    if (highResMain && highResMain !== p.image) {
      updates.image = highResMain;
      needsUpdate = true;
      imagesUpdated++;
      console.log(`[HIGH-RES IMAGE] Product ${p.id}: Image upgraded to high-res`);
    }

    if (Array.isArray(p.images) && p.images.length > 0) {
      const cleanedImages = p.images.map(img => getHighResImageUrl(img)).filter(Boolean);
      if (JSON.stringify(cleanedImages) !== JSON.stringify(p.images)) {
        updates.images = cleanedImages;
        needsUpdate = true;
      }
    }

    // Perform DB update if needed
    if (needsUpdate && Object.keys(updates).length > 0) {
      const { error: uErr } = await supabase.from('products').update(updates).eq('id', p.id);
      if (uErr) {
        console.error(`Failed to update product ${p.id}:`, uErr.message);
      }
    }
  }

  console.log("\n=================================================");
  console.log("DB RE-CATEGORIZATION & IMAGE BATCH UPDATE COMPLETE");
  console.log(` - Categories Updated: ${categoriesUpdated}`);
  console.log(` - High-Res Images Upgraded: ${imagesUpdated}`);
  console.log("=================================================");
}

fixCatalogData();
