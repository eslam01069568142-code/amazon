const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDb() {
  const { data: products } = await supabase.from('products').select('id, category, title, price, original_price, original_url');
  const { data: sections } = await supabase.from('sections').select('id, title, parent_id, category, type');
  
  console.log(`Products Count: ${products?.length || 0}`);
  console.log(`Sections Count: ${sections?.length || 0}`);
  
  const tax = sections?.filter(s => s.type === 'products_by_category') || [];
  const parents = tax.filter(t => !t.parent_id);
  const children = tax.filter(t => t.parent_id);
  
  console.log(`Parents Count: ${parents.length}`);
  console.log(`Children Count: ${children.length}`);
  console.log(`Has Fallback (غير مصنف): ${tax.some(t => t.title === 'غير مصنف')}`);
}

checkDb();
