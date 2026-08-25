const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: sections } = await supabaseAdmin.from('sections').select('category, title').in('category', ['cat_6d04c5ft6', 'cat_q8ol87c8r', 'cat_a3yzg81fr']);
  console.log(sections);
}
run();
