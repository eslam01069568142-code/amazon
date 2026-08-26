const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});
const supabase = createClient(url, key);

async function fix() {
  const { data: sectsBefore } = await supabase.from('sections').select('*', { count: 'exact' });
  const countBefore = sectsBefore.length;
  
  // 1. Update the original parent
  await supabase.from('sections')
    .update({
      title: 'الصحة والجمال',
      parent_id: null,
      is_featured: true
    })
    .eq('id', 'sec_wehymsnn5');
    
  // 2. Link children to original parent category (cat_g3n6vkljv)
  // Children currently have parent_id = 'cat_1sf1jpbjc'
  await supabase.from('sections')
    .update({ parent_id: 'cat_g3n6vkljv' })
    .eq('parent_id', 'cat_1sf1jpbjc');
    
  // 3. Mark the duplicate parent as disabled
  await supabase.from('sections')
    .update({
      title: '__DUPLICATE__ الصحة والجمال',
      parent_id: null,
      is_featured: false,
      enabled: false
    })
    .eq('id', 'sec_s30je98ug');
    
  // Report
  const { data: prods } = await supabase.from('products').select('*', { count: 'exact' });
  const { data: sectsAfter } = await supabase.from('sections').select('*', { count: 'exact' });
  
  console.log('--- POST-FIX REPORT ---');
  console.log('Categories Count Before:', countBefore);
  console.log('Categories Count After:', sectsAfter.length);
  console.log('Products Count:', prods.length);
  
  const targetSections = sectsAfter.filter(s => 
    s.id === 'sec_wehymsnn5' || 
    s.id === 'sec_s30je98ug' || 
    s.parent_id === 'cat_g3n6vkljv' || 
    s.parent_id === 'cat_1sf1jpbjc'
  );
  
  targetSections.forEach(s => {
    console.log(`\nID: ${s.id} | Title: ${s.title}`);
    console.log(`Category: ${s.category} | ParentID: ${s.parent_id}`);
    console.log(`IsFeatured: ${s.is_featured} | Enabled: ${s.enabled}`);
  });
}

fix();
