require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Derived from HomepageProductGrid.tsx
const oldToNewMap = {
  'cat_uzhhuoj5g': 'الإلكترونيات والتكنولوجيا',
  'cat_mfufmoad0': 'المنزل والمطبخ',
  'cat_hbxqqz95p': 'الأزياء والإكسسوارات',
  'cat_hfskvya0h': 'الأزياء والإكسسوارات',
  'cat_oxh8hivt8': 'الأزياء والإكسسوارات',
  'cat_g3n6vkljv': 'الصحة والجمال',
  'cat_ut73yprlm': 'الصحة والجمال',
  'cat_dvuxkdjve': 'السيارات',
  'cat_gnkssf8aq': 'الرياضة واللياقة',
  'cat_ouk0kv2k7': 'الرياضة واللياقة',
  'cat_dby0c7bhh': 'المكتبيات',
  'cat_mtnxvq39': 'ماي واي',
  'cat_kbp8na6k6': 'Home Appliances', // Missing from parentMappings, guessing
  'cat_6k6saayuh': 'Toys',
  'cat_fj0r4ax73': 'ألعاب أطفال',
  'cat_nsexgbpk6': 'Baby Products',
  'cat_2zjelnsdg': 'أدوات المائدة',
  'cat_o6r080tvi': 'العطور',
  'cat_accessories': 'الإلكترونيات',
  'cat_audio': 'الصوتيات',
  'cat_6d04c5ft6': 'أدوات المطبخ',
  'cat_backpacks': 'الحقائب',
  'cat_62fdle3jq': 'حقائب',
  'cat_travelcross': 'حقائب',
  'cat_r826y1abx': 'الصحة والجمال',
  'cat_u310yd1w3': 'المنزل والمطبخ',
  'cat_9pyqkxiit': 'المكتبيات',
  'cat_fmbmubvnt': 'المكتبيات',
  'cat_jiacjmtx3': 'الرياضة واللياقة',
  'cat_bwoqca3kt': 'الصحة والجمال',
  'cat_a6s6tp65d': 'السيارات',
  'cat_955651762abe': 'العدد والأدوات',
  'cat_bd52801767a6': 'الأزياء والإكسسوارات',
  'cat_1fcbcb0752d8': 'الصحة والجمال',
  'cat_aaf0fbe22f26': 'المنزل والمطبخ',
  'cat_b9af786a4c81': 'المنزل والمطبخ'
};

async function runPhase3() {
  const { data: products } = await supabase.from('products').select('*');
  const { data: sections } = await supabase.from('sections').select('id, category, title');
  
  // Create reverse map for new sections by title
  const newSectionMap = {};
  sections.forEach(s => {
    newSectionMap[s.title] = s.category; // using category as the ID
    newSectionMap[s.category] = s.category; // some already match
  });

  const mapping = [];
  let orphans = 0;
  
  for (const p of products) {
    const oldCatId = p.category;
    let newCatTitle = oldToNewMap[oldCatId] || oldCatId;
    
    let current_valid_category = newSectionMap[newCatTitle];
    if (!current_valid_category) {
      // Fuzzy match
      const fuzzy = sections.find(s => s.title.includes(newCatTitle) || newCatTitle.includes(s.title));
      if (fuzzy) {
        current_valid_category = fuzzy.category;
      }
    }
    
    // Auto-safe logic based on explicit Phase 4/5 rules
    let action = 'AUTO-SAFE';
    let brand = 'Unknown';
    let reason = 'Direct mapping from old ID to new section';
    
    const titleLower = (p.title || '').toLowerCase();
    
    if (titleLower.includes('دامبل') || titleLower.includes('رياض')) {
      current_valid_category = newSectionMap['الرياضة واللياقة'] || current_valid_category;
    }
    if (titleLower.includes('لجينجز')) {
      current_valid_category = newSectionMap['الأزياء والإكسسوارات'] || current_valid_category;
    }
    if (titleLower.includes('لاب توب') && titleLower.includes('شنطة')) {
      action = 'HUMAN-REVIEW';
      reason = 'Ambiguous between Tech and Fashion';
    }
    
    // My Way brand detection
    if (titleLower.includes('ماي واي') || titleLower.includes('my way') || oldCatId === 'cat_mtnxvq39') {
      brand = 'My Way';
      // category should be extracted from product, default to health & beauty for my way if unknown
      if (oldCatId === 'cat_mtnxvq39') {
        current_valid_category = newSectionMap['الصحة والجمال'] || current_valid_category;
        reason = 'My Way product re-categorized to Health & Beauty';
      }
    }
    
    if (!current_valid_category) {
      action = 'DO-NOT-TOUCH';
      reason = 'No valid category found';
    }

    if (oldCatId === current_valid_category) {
      action = 'UNCHANGED';
    }
    
    if (action !== 'UNCHANGED') {
      mapping.push({
        product_id: p.id,
        title: p.title,
        old_category: oldCatId,
        current_valid_category,
        brand,
        action,
        reason
      });
    }
  }
  
  fs.writeFileSync('phase_3_dry_run.json', JSON.stringify(mapping, null, 2));
  console.log(`Dry run complete. ${mapping.length} products to be changed.`);
}

runPhase3().catch(console.error);
