const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runAudit() {
  const { data: sections } = await supabase.from('sections').select('*');
  const { data: products } = await supabase.from('products').select('*');

  const report = {
    sections: sections,
    products: products
  };

  const fs = require('fs');
  fs.writeFileSync('audit-data.json', JSON.stringify(report, null, 2));
  console.log('Extracted to audit-data.json');
}

runAudit();
