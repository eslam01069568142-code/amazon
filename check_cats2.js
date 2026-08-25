const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: sections } = await supabaseAdmin.from('sections').select('category, title').eq('category', 'cat_uzhhuoj5g');
  console.log(sections);
}
run();
