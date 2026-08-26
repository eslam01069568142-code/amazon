import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function wipeProducts() {
  const { data: beforeCount } = await supabase.from('products').select('id', { count: 'exact' });
  console.log(`Products before deletion: ${beforeCount?.length || 0}`);
  
  const { error } = await supabase.from('products').delete().neq('id', '0');
  
  if (error) {
    console.error("Error deleting products:", error);
  } else {
    const { data: afterCount } = await supabase.from('products').select('id', { count: 'exact' });
    console.log(`Products after deletion: ${afterCount?.length || 0}`);
  }
}

wipeProducts();
