const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const DEPRECATED_CATS = [
  'cat_kitchenapps',
  'cat_kitchentools',
  'cat_perfumes',
  'cat_personalcare',
  'cat_1sf1jpbjc'
];

const CANONICAL_MAPPING = {
  'cat_kitchenapps': 'cat_c4tky0yxa',
  'cat_kitchentools': 'cat_6d04c5ft6',
  'cat_perfumes': 'cat_o6r080tvi',
  'cat_personalcare': 'cat_r826y1abx'
};

const SPECIFIC_FIXES = [
  { titleMatch: 'ريدمي 15C', expected: 'cat_phones', conf: '95%', name: 'Redmi 15C' },
  { titleMatch: 'ميكروفون لاسلكي', expected: 'cat_audio', conf: '95%', name: 'Wireless Microphone' },
  { titleMatch: 'شنطة سفر دفل', expected: 'cat_62fdle3jq', conf: '99%', name: 'Travel Duffel/Gym Bag' },
];

async function executePhaseA() {
  console.log("==========================================");
  console.log("🚀 STARTING PHASE A MIGRATION EXECUTION");
  console.log("==========================================");

  const { data: products } = await supabase.from('products').select('*');
  if (products.length !== 62) {
      console.error(`❌ FATAL: Product count changed to ${products.length}. STOPPING.`);
      process.exit(1);
  }

  // 1. MIGRATING PRODUCTS FROM DUPLICATE CATEGORIES
  console.log("\nMigrating products from duplicate categories...");
  for (const p of products) {
    if (CANONICAL_MAPPING[p.category]) {
       const newCat = CANONICAL_MAPPING[p.category];
       const { error } = await supabase.from('products').update({ category: newCat }).eq('id', p.id);
       if (error) {
           console.error(`❌ Failed to update product ${p.id}:`, error);
       } else {
           console.log(`✅ [Product ${p.id}] Moved ${p.category} -> ${newCat}`);
       }
    }
  }

  // 2. SPECIFIC FIXES
  console.log("\nApplying specific fixes...");
  for (const fix of SPECIFIC_FIXES) {
      const p = products.find(prod => prod.title.includes(fix.titleMatch));
      if (p && p.category !== fix.expected) {
         const { error } = await supabase.from('products').update({ category: fix.expected }).eq('id', p.id);
         if (error) {
            console.error(`❌ Failed to apply specific fix for ${p.id}:`, error);
         } else {
            console.log(`✅ [Product ${p.id}] Specific Fix: Moved ${p.category} -> ${fix.expected} (${fix.name})`);
         }
      }
  }

  // 3. DISABLING DUPLICATE CATEGORIES
  console.log("\nDisabling duplicate categories...");
  for (const c of DEPRECATED_CATS) {
      const { error } = await supabase.from('sections').update({ enabled: false }).eq('category', c);
      if (error) {
          console.error(`❌ Failed to disable section ${c}:`, error);
      } else {
          console.log(`✅ [Section ${c}] Set enabled = false`);
      }
  }

  // 4. ARCHIVING LEGACY SCRIPTS
  console.log("\nArchiving legacy scripts...");
  const legacyDir = path.join(__dirname, 'legacy');
  if (!fs.existsSync(legacyDir)) {
      fs.mkdirSync(legacyDir);
  }
  
  const scriptsToArchive = [
      'deep-fix-categories.js',
      'master-clean-categories.js',
      'organize-all-categories.js',
      'align-categories.js',
      'organize-electronics.js',
      'fix-powerbank-audio.js',
      'fix-car-starter-final.js',
      'restore-toys-products.js',
  ];

  scriptsToArchive.forEach(script => {
      const oldPath = path.join(__dirname, script);
      const newPath = path.join(legacyDir, script);
      if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          console.log(`✅ Archived script: ${script}`);
      }
  });

  // FINAL VALIDATION
  const { data: finalProducts } = await supabase.from('products').select('*');
  const { data: finalSections } = await supabase.from('sections').select('*');
  
  console.log("\n==========================================");
  console.log("🏁 PHASE A MIGRATION COMPLETE");
  console.log("==========================================");
  console.log(`Final Products: ${finalProducts.length}`);
  console.log(`Final Sections: ${finalSections.length}`);
  
  const deprecatedStillUsed = finalProducts.filter(p => DEPRECATED_CATS.includes(p.category));
  if (deprecatedStillUsed.length > 0) {
      console.error(`❌ FATAL: ${deprecatedStillUsed.length} products are still in deprecated categories!`);
  } else {
      console.log("✅ Zero products remain in deprecated categories.");
  }
}

executePhaseA();
