const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixManualMapping() {
  console.log("=================================================");
  console.log("STARTING HARDCODED PRODUCT RE-CATEGORIZATION");
  console.log("=================================================");

  const updates = [
    // 1. Fix Misclassified Items:
    { id: 'prod_B04pvvHVb', targetCat: 'cat_uzhhuoj5g', desc: 'بادة ماوس' },
    { id: 'prod_B04M8FvJl', targetCat: 'cat_uzhhuoj5g', desc: 'مشغل سيارة/منفاخ' },
    { id: 'prod_B03i2DyC2', targetCat: 'cat_mfufmoad0', desc: 'فرشاة تنظيف' },
    { id: 'prod_B0aKbDc8I', targetCat: 'cat_uzhhuoj5g', desc: 'موصل بي ان سي' },

    // 2. Distribute Men's Clothes (cat_hfskvya0h):
    { id: 'prod_B0go07muW', targetCat: 'cat_hfskvya0h', desc: 'بوكسر رجالي' },
    { id: 'prod_B0dzZ4hDA', targetCat: 'cat_hfskvya0h', desc: 'تي شيرت موباكو' },
    { id: 'prod_B00pfllDS', targetCat: 'cat_hfskvya0h', desc: 'تيشرت بولو' },
    { id: 'prod_B06TutROA', targetCat: 'cat_hfskvya0h', desc: 'بلوزة/تيشيرت دايس' },
    { id: 'prod_B08gRuikj', targetCat: 'cat_hfskvya0h', desc: 'شرابات رجال' },
    { id: 'prod_B02NXGcVl', targetCat: 'cat_hfskvya0h', desc: 'قميص كلاسيكي' },
    { id: 'prod_B01F5lEf4', targetCat: 'cat_hfskvya0h', desc: 'فانلة قطن رجال' },

    // 3. Distribute Women's Clothes (cat_oxh8hivt8):
    { id: 'prod_B0im1AKgk', targetCat: 'cat_oxh8hivt8', desc: 'شرابات نساء' },
    { id: 'prod_B0ey6T7LJ', targetCat: 'cat_oxh8hivt8', desc: 'حمالة صدر' },
    { id: 'prod_B0hMmkNz7', targetCat: 'cat_oxh8hivt8', desc: 'بنطلون جينز' },
    { id: 'prod_B0dHXH3Cp', targetCat: 'cat_oxh8hivt8', desc: 'ملابس داخلية نساء' }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from('products')
      .update({ category: update.targetCat })
      .eq('id', update.id);

    if (error) {
      console.error(`❌ Failed to update ${update.id} (${update.desc}): ${error.message}`);
      failCount++;
    } else {
      console.log(`✅ [UPDATED] ${update.id} (${update.desc}) -> moved to '${update.targetCat}'`);
      successCount++;
    }
  }

  console.log("=================================================");
  console.log(`MANUAL MAPPING COMPLETE! Success: ${successCount}, Failed: ${failCount}`);
  console.log("=================================================");
}

fixManualMapping();
