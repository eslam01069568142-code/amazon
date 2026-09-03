const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function masterCleanCategories() {
  console.log("=================================================");
  console.log("STARTING MASTER CATEGORY CLEANUP");
  console.log("=================================================");

  const { data: products } = await supabase.from('products').select('id, title, category');
  
  if (!products) {
    console.error("Failed to fetch products.");
    return;
  }

  let checkedCount = products.length;
  let correctedCount = 0;
  
  // A helper map to store moving stats
  const moves = {};

  for (const p of products) {
    const t = p.title.toLowerCase();
    let correctCat = p.category; // default to current

    // 1. Fashion/Clothing
    if (t.match(/بنطلون|قميص|فستان|حذاء|بوكسر|تي شيرت|تيشرت|بلوزة|شرابات|ملابس|جينز|قطن|دايس/)) {
      if (t.match(/رجالي|رجال|شباب/)) {
        correctCat = 'cat_hfskvya0h'; // Men
      } else if (t.match(/نساء|حريمي|سيدات|حمالة|حريمى/)) {
        correctCat = 'cat_oxh8hivt8'; // Women
      } else {
        correctCat = 'cat_hfskvya0h'; // Default fashion
      }
    }
    // 2. Personal Care & Beauty
    else if (t.match(/عطر|بارفيوم|ماء الذهب|فوج|برفان|بخاخ/)) {
      correctCat = 'cat_perfumes';
    } else if (t.match(/شامبو|استحمام|نيفيا|مزيل عرق|بلسم|العناية|غسول|فرشاة اسنان|حلاقة|ماكينة حلاقة/)) {
      correctCat = 'cat_personalcare';
    }
    // 3. Home & Kitchen
    else if (t.match(/خلاط|ماكينة صنع|تكييف|ميكروويف|عجان|فيليبس|بلاك اند ديكر|قهوة/)) {
      correctCat = 'cat_kitchenapps';
    } else if (t.match(/طاسة|منظم|خفق|فرشاة تنظيف|صلصال|مطبخ/)) {
      correctCat = 'cat_kitchentools';
    }
    // 4. Cars
    else if (t.match(/ستارتر|مشغل سيارة|ضاغط|سيارات|محمول للسيارة/)) {
      correctCat = 'cat_a6s6tp65d'; // Car Electronics
    }
    // 5. Electronics
    else if (t.match(/باور بانك|شاحن|شحن/)) {
      correctCat = 'cat_power';
    } else if (t.match(/كاميرا|مراقبة/)) {
      correctCat = 'cat_cameras';
    } else if (t.match(/سماعة|سماعات|ميكروفون|ايربودز/)) {
      correctCat = 'cat_audio';
    } else if (t.match(/موبايل|ريدمي|هاتف|سامسونج/)) {
      correctCat = 'cat_phones';
    } else if (t.match(/بادة ماوس|حامل|موصل|شاشة حماية/)) {
      correctCat = 'cat_accessories';
    }
    // 6. Bags
    else if (t.match(/شنطة ظهر|حقيبة ظهر/)) {
      correctCat = 'cat_backpacks';
    } else if (t.match(/شنطة سفر|كروس|دفل|سفر/)) {
      correctCat = 'cat_travelcross';
    }

    if (correctCat !== p.category) {
      // It's misclassified!
      const { error } = await supabase.from('products').update({ category: correctCat }).eq('id', p.id);
      if (error) {
        console.error(`[ERROR] Failed to update ${p.id}: ${error.message}`);
      } else {
        console.log(`[MOVED] "${p.title.substring(0,30)}..." -> from ${p.category} to ${correctCat}`);
        correctedCount++;
        
        const key = `${p.category} -> ${correctCat}`;
        moves[key] = (moves[key] || 0) + 1;
      }
    }
  }

  console.log("=================================================");
  console.log(`MASTER CLEANUP COMPLETE!`);
  console.log(`Checked Products: ${checkedCount}`);
  console.log(`Corrected/Moved Products: ${correctedCount}`);
  console.log("Move Summary:");
  for (const [route, count] of Object.entries(moves)) {
    console.log(`  - ${route}: ${count} products`);
  }
  console.log("=================================================");
}

masterCleanCategories();
