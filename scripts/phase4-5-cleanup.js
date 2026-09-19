require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runCleanup() {
  const mapping = JSON.parse(fs.readFileSync('phase_3_dry_run.json'));
  
  let successCount = 0;
  for (const m of mapping) {
    if (m.action === 'AUTO-SAFE') {
      const updateData = { category: m.current_valid_category };
      if (m.brand === 'My Way') {
        updateData.is_my_way = true; // Fallback for brand column
      }
      
      const { error } = await supabase.from('products').update(updateData).eq('id', m.product_id);
      if (error) {
        console.error('Error updating', m.product_id, error);
      } else {
        successCount++;
      }
    }
  }
  console.log(`Phase 4/5 complete: ${successCount} products updated via AUTO-SAFE.`);
}

runCleanup().catch(console.error);
