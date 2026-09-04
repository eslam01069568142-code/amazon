const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function organizeAllCategories() {
  console.log("=================================================");
  console.log("STARTING GLOBAL TAXONOMY ORGANIZATION");
  console.log("=================================================");

  const subcats = [
    // --- Home & Kitchen (cat_mfufmoad0) ---
    { id: 'sec_kitchen_apps', category: 'cat_kitchenapps', title: 'أجهزة المطبخ والمنزل', parent_id: 'cat_mfufmoad0', type: 'products_by_category', enabled: true },
    { id: 'sec_kitchen_tools', category: 'cat_kitchentools', title: 'أدوات ومستلزمات', parent_id: 'cat_mfufmoad0', type: 'products_by_category', enabled: true },
    
    // --- Health & Beauty (cat_g3n6vkljv) ---
    { id: 'sec_perfumes', category: 'cat_perfumes', title: 'عطور', parent_id: 'cat_g3n6vkljv', type: 'products_by_category', enabled: true },
    { id: 'sec_personal_care', category: 'cat_personalcare', title: 'عناية شخصية', parent_id: 'cat_g3n6vkljv', type: 'products_by_category', enabled: true },
    
    // --- Bags (cat_62fdle3jq) ---
    { id: 'sec_backpacks', category: 'cat_backpacks', title: 'شنط ظهر', parent_id: 'cat_62fdle3jq', type: 'products_by_category', enabled: true },
    { id: 'sec_travel_cross', category: 'cat_travelcross', title: 'شنط سفر وكروس', parent_id: 'cat_62fdle3jq', type: 'products_by_category', enabled: true },
    
    // --- Electronics (cat_uzhhuoj5g) ---
    { id: 'sec_audio', category: 'cat_audio', title: 'صوتيات', parent_id: 'cat_uzhhuoj5g', type: 'products_by_category', enabled: true },
    { id: 'sec_phones', category: 'cat_phones', title: 'موبايلات', parent_id: 'cat_uzhhuoj5g', type: 'products_by_category', enabled: true },
    { id: 'sec_cameras', category: 'cat_cameras', title: 'كاميرات مراقبة', parent_id: 'cat_uzhhuoj5g', type: 'products_by_category', enabled: true },
    { id: 'sec_accessories', category: 'cat_accessories', title: 'ملحقات', parent_id: 'cat_uzhhuoj5g', type: 'products_by_category', enabled: true },
    { id: 'sec_power', category: 'cat_power', title: 'باور بانك وشواحن', parent_id: 'cat_uzhhuoj5g', type: 'products_by_category', enabled: true },

    // --- Fashion & Clothes (cat_hbxqqz95p) ---
    // (We already have cat_hfskvya0h for Men, cat_oxh8hivt8 for Women, etc. Let's make sure they are linked)
  ];

  console.log("Upserting Subcategories...");
  for (const s of subcats) {
    const { error } = await supabase.from('sections').upsert({ 
      id: s.id, 
      category: s.category, 
      title: s.title, 
      parent_id: s.parent_id, 
      type: s.type, 
      enabled: s.enabled 
    }, { onConflict: 'id' });
    if (error) console.error(`Error upserting ${s.category}:`, error.message);
  }

  const { data: products } = await supabase.from('products').select('id, title, category');
  let moved = 0;

  for (const p of (products || [])) {
    const t = p.title.toLowerCase();
    let newCat = p.category;

    // --- Home & Kitchen ---
    if (t.match(/فيليبس|بلاك اند ديكر|تكييف|كارير|خلاط|ماكينة صنع/)) {
      newCat = 'cat_kitchenapps';
    } else if (t.match(/صانع رغوة|أداة خفق|فرش|أدوات/)) {
      newCat = 'cat_kitchentools';
    }
    
    // --- Health & Beauty ---
    else if (t.match(/عطر|فوج|ماء الذهب|بارفيوم/)) {
      newCat = 'cat_perfumes';
    } else if (t.match(/استحمام|نيفيا|مزيل عرق|جل/)) {
      newCat = 'cat_personalcare';
    }

    // --- Bags ---
    else if (t.match(/شنطة ظهر/)) {
      newCat = 'cat_backpacks';
    } else if (t.match(/سفر|كروس/)) {
      newCat = 'cat_travelcross';
    }

    // --- Electronics ---
    else if (t.match(/موبايل ريدمي/)) {
      newCat = 'cat_phones';
    } else if (t.match(/كاميرا مراقبة|كاميرا ذكية/)) {
      newCat = 'cat_cameras';
    } else if (t.match(/ميكروفون|سماعة|سماعات/)) {
      newCat = 'cat_audio';
    } else if (t.match(/باور بانك|ستارتر|شاحن/)) {
      newCat = 'cat_power';
    } else if (t.match(/حامل|بادة ماوس|شاشة حماية|موصل/)) {
      newCat = 'cat_accessories';
    }

    if (newCat && newCat !== p.category) {
      await supabase.from('products').update({ category: newCat }).eq('id', p.id);
      console.log(`[MOVED] ${p.id} -> ${newCat} ("${p.title.substring(0, 30)}...")`);
      moved++;
    }
  }

  console.log("=================================================");
  console.log(`GLOBAL ORGANIZATION COMPLETE! Moved ${moved} products to new subcategories.`);
  console.log("=================================================");
}

organizeAllCategories();
