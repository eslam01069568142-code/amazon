require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runPhase0Audit() {
  console.log('--- DB SCHEMA CHECK ---');
  // Check tables presence by fetching 1 row
  const [
    { data: pData, error: pErr },
    { data: sData, error: sErr },
    { data: oData, error: oErr },
    { data: phData, error: phErr }
  ] = await Promise.all([
    supabase.from('products').select('*').limit(1),
    supabase.from('sections').select('*').limit(1),
    supabase.from('product_offers').select('*').limit(1),
    supabase.from('price_history').select('*').limit(1)
  ]);
  
  console.log('products schema:', Object.keys(pData?.[0] || {}));
  console.log('sections schema:', Object.keys(sData?.[0] || {}));
  console.log('product_offers schema:', Object.keys(oData?.[0] || {}));
  console.log('price_history exists?', phErr ? 'No' : 'Yes');

  console.log('\n--- DATA INTEGRITY (category -> sections.id) ---');
  const { data: allProducts } = await supabase.from('products').select('id, category, is_my_way, title');
  const { data: allSections } = await supabase.from('sections').select('id');

  const sectionIds = new Set(allSections.map(s => s.id));
  
  let totalProducts = allProducts.length;
  let nullCategory = 0;
  let invalidCategory = 0;
  let myWayTrue = 0;
  let myWayFalse = 0;
  let myWayTrueProducts = [];
  let orphans = [];

  for (const p of allProducts) {
    if (p.is_my_way === true) {
      myWayTrue++;
      myWayTrueProducts.push({ id: p.id, title: p.title });
    } else if (p.is_my_way === false) {
      myWayFalse++;
    }

    if (p.category === null || p.category === undefined) {
      nullCategory++;
    } else if (!sectionIds.has(p.category)) {
      invalidCategory++;
      orphans.push({ id: p.id, category: p.category });
    }
  }

  console.log(`Total Products: ${totalProducts}`);
  console.log(`Null Categories: ${nullCategory}`);
  console.log(`Invalid Categories (Orphans/Legacy): ${invalidCategory}`);
  console.log(`Orphans List:`, JSON.stringify(orphans));

  console.log('\n--- IS_MY_WAY FINDINGS ---');
  console.log(`is_my_way = true: ${myWayTrue}`);
  console.log(`is_my_way = false: ${myWayFalse}`);
  if (myWayTrue > 0) {
    console.log(`First 5 is_my_way=true products:`, JSON.stringify(myWayTrueProducts.slice(0, 5)));
  }

  console.log('\n--- TYPE CHECKS ---');
  if (allProducts.length > 0) console.log('products.category typeof:', typeof allProducts[0].category);
  if (allSections.length > 0) console.log('sections.id typeof:', typeof allSections[0].id);

}

runPhase0Audit().catch(console.error);
