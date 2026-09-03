const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function alignCategories() {
  console.log("=================================================");
  console.log("STARTING CATEGORY TAXONOMY & PRODUCT REALIGNMENT");
  console.log("=================================================");

  // 1. Update Sections Titles & Parent-Child Relationships in Supabase
  const sectionsToUpdate = [
    { id: 'sec_h2e8oog2y', category: 'cat_hbxqqz95p', title: 'أزياء وملابس', parent_id: null, enabled: true },
    { id: 'sec_6hta7wv9q', category: 'cat_mfufmoad0', title: 'المنزل والمطبخ', parent_id: null, enabled: true },
    { id: 'sec_wehymsnn5', category: 'cat_g3n6vkljv', title: 'الصحة والجمال', parent_id: null, enabled: true },
    { id: 'sec_ixrhn50k2', category: 'cat_uzhhuoj5g', title: 'الإلكترونيات', parent_id: null, enabled: true },
    { id: 'sec_0zalpk1ca', category: 'cat_gnkssf8aq', title: 'الرياضة واللياقة', parent_id: null, enabled: true },
    { id: 'sec_lyjbgey3d', category: 'cat_62fdle3jq', title: 'الحقائب والشنط', parent_id: 'cat_hbxqqz95p', enabled: true },
    { id: 'sec_8hvqdrgcl', category: 'cat_5kv8y47df', title: 'الأحذية', parent_id: 'cat_hbxqqz95p', enabled: true },
    { id: 'sec_qndcbxgc8', category: 'cat_r826y1abx', title: 'أجهزة العناية الشخصية', parent_id: 'cat_g3n6vkljv', enabled: true },
    { id: 'sec_p2s8jaoo5', category: 'cat_6d04c5ft6', title: 'أدوات المطبخ والطبخ', parent_id: 'cat_mfufmoad0', enabled: true },
    { id: 'sec_lpkmc2zpr', category: 'cat_c4tky0yxa', title: 'الأجهزة المنزلية', parent_id: 'cat_mfufmoad0', enabled: true },
  ];

  for (const s of sectionsToUpdate) {
    const { error } = await supabase
      .from('sections')
      .update({ title: s.title, parent_id: s.parent_id, enabled: s.enabled })
      .eq('id', s.id);

    if (error) {
      console.error(`Failed to update section ${s.id}:`, error.message);
    } else {
      console.log(`[SECTION UPDATED] ${s.id} -> Title: '${s.title}' | Parent: ${s.parent_id}`);
    }
  }

  // 2. Re-align Products to their true specific categories
  const { data: products } = await supabase.from('products').select('id, title, category');
  console.log(`\nAUDITING ${products?.length} PRODUCTS FOR REALIGNMENT...`);

  let movedCount = 0;

  for (const p of (products || [])) {
    const titleLower = p.title.toLowerCase();
    let targetCat = p.category;

    // A. Coffee Makers, ACs, Kitchen Appliances -> Home & Kitchen (cat_mfufmoad0 or cat_6d04c5ft6)
    if (titleLower.match(/(قهوة|تكييف|كارير|خلاط|غلاية|صانع رغوة|أدوات المطبخ|ماكينة صنع قهوة|فيليبس.*قهوة|بلاك اند ديكر.*قهوة)/i)) {
      targetCat = 'cat_mfufmoad0';
    }
    // B. Power Banks, Jump Starters, Phone Chargers -> Electronics / Charging (cat_uzhhuoj5g or cat_z2p4a5gd3)
    else if (titleLower.match(/(باور بانك|power bank|شاحن|ستارتر|جامب ستارتر|موبايل|هاتف|سماعة|ميكروفون|ريدمي|أورايمو|جيه ار|باسيوس|هوليلاند|نيلمبوت|موباكو)/i) && !titleLower.match(/تي شيرت|قميص/i)) {
      targetCat = 'cat_uzhhuoj5g';
    }
    // C. Clothes, Shirts, Boxers, Socks, Underwear -> Fashion & Clothes (cat_hbxqqz95p)
    else if (titleLower.match(/(قميص|تيشرت|تي شيرت|بوكسر|فانلة|شرابات|حمالة صدر|بنطلون|جينز|ملابس|بلوزة|ترنج|فستان|جاكيت|دايس|شارمين|ال سي وايكيكي|وايت ايجل)/i)) {
      targetCat = 'cat_hbxqqz95p';
    }
    // D. Shoes -> Shoes (cat_5kv8y47df)
    else if (titleLower.match(/(حذاء|كوتشي|اديداس|سنيكرز|صندل|أحذية)/i)) {
      targetCat = 'cat_5kv8y47df';
    }
    // E. Bags -> Bags (cat_62fdle3jq)
    else if (titleLower.match(/(شنطة|حقيبة|حقائب|رحالا|بيترايس)/i)) {
      targetCat = 'cat_62fdle3jq';
    }
    // F. Perfumes, Skincare, Beauty -> Health & Beauty (cat_g3n6vkljv)
    else if (titleLower.match(/(بخاخ عطر|عطر|ماء الذهب|نيفيا|جل استحمام|مزيل عرق|سيليكون|غسول)/i)) {
      targetCat = 'cat_g3n6vkljv';
    }

    if (targetCat && targetCat !== p.category) {
      await supabase.from('products').update({ category: targetCat }).eq('id', p.id);
      movedCount++;
      console.log(`[PRODUCT REALIGNED] ${p.id}: "${p.title.substring(0, 45)}" -> '${targetCat}' (was '${p.category}')`);
    }
  }

  console.log("\n=================================================");
  console.log(`TAXONOMY & PRODUCT REALIGNMENT COMPLETE! Moved: ${movedCount} products`);
  console.log("=================================================");
}

alignCategories();
