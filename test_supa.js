const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('sections')
    .select('id, title, type, category, enabled, order_index')
    .eq('enabled', true)
    .not('category', 'is', null)
    .order('order_index', { ascending: true });
  
  if (error) console.error('Error:', error);
  console.log('Data count:', data ? data.length : 0);
  console.log(data);
}
test();
