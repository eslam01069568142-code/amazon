const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

// The Final Taxonomy
const taxonomy = {
  'الإلكترونيات': [
    'الهواتف وملحقاتها',
    'لابتوبات وملحقاتها',
    'السماعات والصوتيات',
    'الشواحن والكابلات',
    'الشحن والطاقة المحمولة',
    'الكاميرات والتصوير',
    'الساعات والأجهزة الذكية'
  ],
  'المنزل والمطبخ': [
    'أدوات المطبخ والطبخ',
    'الأجهزة المنزلية',
    'ديكور ومفروشات',
    'تنظيم وتخزين'
  ],
  'الصحة والجمال': [
    'العناية بالبشرة والجسم',
    'العناية بالشعر',
    'العطور',
    'أجهزة العناية الشخصية'
  ],
  'الأزياء والموضة': [
    'ملابس رجالية',
    'ملابس نسائية',
    'أحذية',
    'حقائب وإكسسوارات'
  ],
  'الرياضة واللياقة': [
    'أجهزة رياضية',
    'ملابس رياضية',
    'مستلزمات الأنشطة الخارجية'
  ],
  'الألعاب والترفيه': [
    'ألعاب إلكترونية',
    'ألعاب أطفال ودمى',
    'ألعاب تعليمية',
    'ألعاب لوحية وترفيهية'
  ],
  'المنتجات المكتبية': [
    'أدوات مكتبية ومدرسية',
    'طابعات وملحقاتها'
  ],
  'مستلزمات السيارات': [
    'إكسسوارات السيارات',
    'إلكترونيات السيارات',
    'العناية بالسيارة',
    'أدوات ومستلزمات الطوارئ'
  ],
  'غير مصنف': [] // Fallback parent, no children needed automatically
};

const featuredParents = ['الإلكترونيات', 'المنزل والمطبخ', 'الصحة والجمال', 'الأزياء والموضة', 'الرياضة واللياقة'];

const renameMap = {
  'فاشون': 'الأزياء والموضة',
  'أدوات منزلية': 'أدوات المطبخ والطبخ',
  'دمى وألعاب': 'الألعاب والترفيه',
  'لابات وإكسسوارات': 'لابتوبات وملحقاتها',
  'المستلزمات الرياضية': 'الرياضة واللياقة',
  'إكسسوارات التصوير': 'الكاميرات والتصوير',
  'سماعات وإكسسواراتها': 'السماعات والصوتيات'
};

function generateId(prefix) {
  return prefix + '_' + Math.random().toString(36).substring(2, 11);
}

async function migrate() {
  const { data: sections, error } = await supabase.from('sections').select('*').eq('type', 'products_by_category');
  if (error) { console.error('Fetch error:', error); return; }

  // 1. Rename existing nodes
  for (const sec of sections) {
    const oldTitle = sec.title;
    let newTitle = renameMap[oldTitle] || oldTitle;
    if (newTitle !== oldTitle) {
      console.log(`Renaming: ${oldTitle} -> ${newTitle}`);
      await supabase.from('sections').update({ title: newTitle }).eq('id', sec.id);
    }
  }

  // Reload after rename
  const { data: updatedSections } = await supabase.from('sections').select('*').eq('type', 'products_by_category');

  // Helper to find existing by title
  const findByTitle = (title) => updatedSections.find(s => s.title === title);

  // 2. Ensure all Parents exist and are marked correctly
  const parentIds = {};
  for (const parentTitle of Object.keys(taxonomy)) {
    let parentSec = findByTitle(parentTitle);
    if (!parentSec) {
      // Create it
      const newSecId = generateId('sec');
      const newCatId = generateId('cat');
      const isFeatured = featuredParents.includes(parentTitle);
      
      const newParent = {
        id: newSecId,
        type: 'products_by_category',
        title: parentTitle,
        category: newCatId,
        parent_id: null,
        is_featured: isFeatured,
        enabled: true,
        order_index: 99
      };
      
      console.log(`Creating missing Parent: ${parentTitle}`);
      await supabase.from('sections').insert(newParent);
      parentIds[parentTitle] = newCatId;
    } else {
      parentIds[parentTitle] = parentSec.category;
      // Ensure it's a parent (parent_id = null) and update is_featured
      const isFeatured = featuredParents.includes(parentTitle);
      await supabase.from('sections').update({ parent_id: null, is_featured: isFeatured }).eq('id', parentSec.id);
      console.log(`Updated existing Parent: ${parentTitle}`);
    }
  }

  // Re-fetch all again to ensure we have up-to-date parents
  const { data: currentSections } = await supabase.from('sections').select('*').eq('type', 'products_by_category');
  const getCatIdByTitle = (title) => currentSections.find(s => s.title === title)?.category;

  // 3. Ensure all Children exist and are linked to their parents
  for (const [parentTitle, children] of Object.entries(taxonomy)) {
    const parentCatId = getCatIdByTitle(parentTitle);
    
    for (const childTitle of children) {
      let childSec = currentSections.find(s => s.title === childTitle);
      
      if (!childSec) {
        // Create child
        const newSecId = generateId('sec');
        const newCatId = generateId('cat');
        
        const newChild = {
          id: newSecId,
          type: 'products_by_category',
          title: childTitle,
          category: newCatId,
          parent_id: parentCatId,
          is_featured: false,
          enabled: true,
          order_index: 999
        };
        console.log(`Creating missing Child: ${childTitle} (Parent: ${parentTitle})`);
        await supabase.from('sections').insert(newChild);
      } else {
        // Update child to link to parent
        if (childSec.parent_id !== parentCatId) {
          console.log(`Linking existing Child: ${childTitle} -> Parent: ${parentTitle}`);
          await supabase.from('sections').update({ parent_id: parentCatId }).eq('id', childSec.id);
        }
      }
    }
  }
  
  console.log('--- Migration Completed ---');
}

migrate();
