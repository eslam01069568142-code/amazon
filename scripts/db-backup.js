require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backup() {
  console.log('Backing up DB...');
  const tables = ['products', 'product_offers', 'sections', 'stores'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Error backing up ${table}:`, error);
    } else {
      fs.writeFileSync(`backup_${table}.json`, JSON.stringify(data, null, 2));
      console.log(`Backed up ${table}: ${data.length} rows`);
    }
  }
}

backup().catch(console.error);
