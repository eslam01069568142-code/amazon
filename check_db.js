import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('original_url', 'https://link.amazon/B0dPKRXkS');

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Product Data:", JSON.stringify(data, null, 2));
  }
}

checkProduct();
