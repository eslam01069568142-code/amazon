const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function report() {
  const { data: prods } = await supabase.from('products').select('*');
  const { data: sects } = await supabase.from('sections').select('*').eq('type', 'products_by_category');
  
  console.log('--- Database Report ---');
  console.log('Products Count:', prods ? prods.length : 0);
  console.log('Sections Count:', sects ? sects.length : 0);
  
  if (!sects) return;
  
  const parents = sects.filter(s => !s.parent_id);
  const children = sects.filter(s => s.parent_id);
  
  console.log('\n--- Taxonomy Tree ---');
  for (const parent of parents) {
    console.log(`\n[Parent] ${parent.title} (ID: ${parent.id}, Category: ${parent.category})`);
    const myChildren = children.filter(c => c.parent_id === parent.category);
    if (myChildren.length === 0) {
      console.log('  -> (No children)');
    } else {
      myChildren.forEach(c => {
        console.log(`  -> [Child] ${c.title} (ID: ${c.id}, Category: ${c.category}, ParentId: ${c.parent_id})`);
      });
    }
  }
}
report();
