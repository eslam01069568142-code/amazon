const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: sections } = await supabase.from('sections').select('id, title, category, parent_id');
  console.log('zpw1oj2b7:', sections.find(s => s.category === 'cat_zpw1oj2b7'));
  console.log('khnmn6p8m:', sections.find(s => s.category === 'cat_khnmn6p8m'));
  
  const { data: products } = await supabase.from('products').select('*');
  console.log('Products Count:', products.length);
  
  // Try to scrape a few more products for covering clothing and kitchen
  const testUrls = [
    'https://www.amazon.eg/-/en/dp/B07R44Y1B1', // generic maybe?
    'https://www.amazon.eg/-/en/dp/B08P1QXY46', // generic maybe?
  ];
  
  for (const url of testUrls) {
      const res = await fetch('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, category: 'General', preview: false })
      });
      const data = await res.json();
      console.log('Scraped extra:', data.success ? data.product.title : 'Failed');
  }
}
check();
