const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: sections, error } = await supabase
    .from('sections')
    .select('id, category, title, type, enabled, parent_id');

  if (error) console.error("SECTIONS QUERY ERROR:", error);

  console.log("==========================================");
  console.log("SECTIONS IN DB (Total:", sections?.length, "):");
  sections?.forEach(s => {
    console.log(`ID: ${s.id} | Cat: '${s.category}' | Title: '${s.title}' | Type: '${s.type}' | Enabled: ${s.enabled} | Parent: ${s.parent_id}`);
  });
  console.log("==========================================");

  const { data: products } = await supabase.from('products').select('id, title, category');
  const catProductCounts = {};
  products?.forEach(p => {
    catProductCounts[p.category] = (catProductCounts[p.category] || 0) + 1;
  });
  console.log("PRODUCT COUNTS PER CATEGORY IN DB:", catProductCounts);
}

run();
