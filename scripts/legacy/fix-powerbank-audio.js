const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixPowerbankAudio() {
  console.log("=================================================");
  console.log("FIXING MISCLASSIFIED POWER BANKS");
  console.log("=================================================");

  // Fetch all products in Audio to check for Power Banks
  const { data: products } = await supabase.from('products').select('id, title, category');
  
  if (!products) {
    console.error("Failed to fetch products.");
    return;
  }

  let moved = 0;
  for (const p of products) {
    const t = p.title.toLowerCase();
    
    // If the product is a Power Bank but it's currently in Audio (cat_audio) or elsewhere that's wrong
    // (Actually, just force anything with "باور بانك" or "شاحن" into cat_power if it's currently cat_audio)
    if (p.category === 'cat_audio' && t.match(/باور بانك|شاحن|power bank/)) {
      console.log(`[FOUND MISCLASSIFIED] ${p.title} (ID: ${p.id}) is in ${p.category}`);
      
      const { error } = await supabase.from('products').update({ category: 'cat_power' }).eq('id', p.id);
      
      if (error) {
        console.error(`[ERROR] Failed to move ${p.id}: ${error.message}`);
      } else {
        console.log(`✅ [MOVED] ${p.id} successfully moved to cat_power (شواحن وباور بانك)`);
        moved++;
      }
    }
  }

  console.log("=================================================");
  console.log(`FIX COMPLETE! Moved ${moved} power banks to correct category.`);
  console.log("=================================================");
}

fixPowerbankAudio();
