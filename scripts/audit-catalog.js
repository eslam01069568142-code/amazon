const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function auditCatalog() {
  console.log("=================================================");
  console.log("READ-ONLY DATABASE CATALOG AUDIT");
  console.log("=================================================\n");

  // 1. Fetch all sections/categories
  const { data: sections, error: sErr } = await supabase
    .from('sections')
    .select('id, category, title, parent_id')
    .eq('type', 'products_by_category');

  if (sErr) {
    console.error("Error fetching sections:", sErr);
    return;
  }

  const categoryMap = {};
  sections?.forEach(s => {
    categoryMap[s.category] = s;
  });

  // 2. Fetch all products
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, title, category, price, image');

  if (pErr) {
    console.error("Error fetching products:", pErr);
    return;
  }

  console.log(`TOTAL PRODUCTS IN DATABASE: ${products?.length}\n`);

  // 3. Group products by assigned category
  const grouped = {};
  products?.forEach(p => {
    const catId = p.category || 'UNASSIGNED';
    if (!grouped[catId]) grouped[catId] = [];
    grouped[catId].push(p);
  });

  // 4. Print grouped audit
  for (const catId of Object.keys(grouped)) {
    const sectionInfo = categoryMap[catId];
    const catTitle = sectionInfo ? sectionInfo.title : (catId === 'UNASSIGNED' ? 'غير مصنف / بدون فئة' : `فئة غير معروفة (${catId})`);
    const parentId = sectionInfo?.parent_id ? ` (Parent: ${sectionInfo.parent_id})` : '';
    const items = grouped[catId];

    console.log(`-------------------------------------------------`);
    console.log(`📁 CATEGORY: "${catTitle}" | ID: '${catId}'${parentId} | Count: ${items.length} items`);
    console.log(`-------------------------------------------------`);

    items.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.id}] ${item.title}`);
      console.log(`     Price: ${item.price || 'N/A'} | Image: ${item.image ? 'Yes' : 'No'}`);
    });
    console.log(``);
  }

  console.log("=================================================");
  console.log("AUDIT COMPLETE - ZERO DB MODIFICATIONS WERE MADE");
  console.log("=================================================");
}

auditCatalog();
