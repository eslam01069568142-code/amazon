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
  { id: 'prod_B04pvvHVb', current: 'cat_power', target: 'cat_phones', titleMatch: 'ريدمي 15C', conf: '95%' }, // Assuming we can match by title if ID is not known, wait, let's match by title
  { titleMatch: 'ريدمي 15C', current: 'cat_power', target: 'cat_phones', conf: '95%' },
  { titleMatch: 'ميكروفون لاسلكي', current: 'cat_power', target: 'cat_audio', conf: '95%' },
  { titleMatch: 'شنطة سفر دفل', current: 'cat_6k6saayuh', target: 'cat_62fdle3jq', conf: '99%' },
  { titleMatch: 'V-290', current: 'cat_personalcare', target: 'cat_r826y1abx', conf: '90%' }
];

async function run() {
  console.log("==========================================");
  console.log("PHASE 0 & 1 — PREFLIGHT & BACKUP");
  console.log("==========================================");

  // 1. BACKUP
  const { data: sections } = await supabase.from('sections').select('*');
  const { data: products } = await supabase.from('products').select('*');
  
  if (!sections || !products) {
    console.error("FATAL ERROR: Could not fetch from database. STOPPING.");
    process.exit(1);
  }

  const backupFile = path.join(__dirname, '..', 'backup-phase-A.json');
  fs.writeFileSync(backupFile, JSON.stringify({ sections, products }, null, 2));
  console.log(`✅ Backup saved to ${backupFile}`);
  console.log(`   Products: ${products.length} | Sections: ${sections.length}`);

  // 2. PREFLIGHT SCAN
  console.log("\nScanning codebase for hardcoded dependencies...");
  let hardcodedFound = false;
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        DEPRECATED_CATS.forEach(cat => {
          if (content.includes(cat) && !fullPath.includes('phase-a-preflight.js') && !fullPath.includes('audit-report') && !fullPath.includes('legacy') && !fullPath.includes('query-audit') && !fullPath.includes('analyze-audit') && !fullPath.includes('remove-redundant-category.js') && !fullPath.includes('restore-toys-products.js')) {
            console.log(`⚠️ Found reference to ${cat} in ${fullPath}`);
            // Check if it's in a legacy script
            if (fullPath.includes('scripts\\')) {
              console.log(`   -> It's in a script. Recommend archiving script.`);
            } else {
              console.error(`   -> 🚨 STOP! Hardcoded dependency in application code!`);
              hardcodedFound = true;
            }
          }
        });
      }
    }
  }

  scanDir(path.join(__dirname, '..', 'src'));
  scanDir(path.join(__dirname, '..', 'scripts'));

  if (hardcodedFound) {
    console.error("\n❌ PREFLIGHT FAILED. Hardcoded dependencies found in application code.");
    process.exit(1);
  }
  console.log("✅ Preflight clear. No application dependencies on deprecated categories.");

  console.log("\n==========================================");
  console.log("PHASE 2 — DRY RUN");
  console.log("==========================================");

  let sectionMap = {};
  sections.forEach(s => sectionMap[s.category] = s.title);

  const dryRunReport = [];

  // Migrate Duplicates
  let duplicateCount = 0;
  for (const p of products) {
    if (CANONICAL_MAPPING[p.category]) {
      const target = CANONICAL_MAPPING[p.category];
      dryRunReport.push({
        id: p.id,
        title: p.title.substring(0, 40) + '...',
        currentCategory: p.category,
        currentName: sectionMap[p.category] || 'Unknown',
        proposedCategory: target,
        proposedName: sectionMap[target] || 'Unknown',
        action: 'DUPLICATE_MERGE',
        confidence: '100%'
      });
      duplicateCount++;
    }
  }

  // Specific Fixes
  let fixesCount = 0;
  for (const fix of SPECIFIC_FIXES) {
    const product = products.find(p => p.title.includes(fix.titleMatch) && p.category === fix.current);
    if (product) {
      dryRunReport.push({
        id: product.id,
        title: product.title.substring(0, 40) + '...',
        currentCategory: product.category,
        currentName: sectionMap[product.category] || 'Unknown',
        proposedCategory: fix.target,
        proposedName: sectionMap[fix.target] || 'Unknown',
        action: 'SPECIFIC_FIX',
        confidence: fix.conf
      });
      fixesCount++;
    }
  }

  console.table(dryRunReport);
  console.log(`\nDry Run Summary:`);
  console.log(`- Duplicate products to migrate: ${duplicateCount}`);
  console.log(`- Specific products to fix: ${fixesCount}`);
  
  console.log("\nCategories to Disable:");
  DEPRECATED_CATS.forEach(c => {
    const s = sections.find(sec => sec.category === c);
    if (s && s.enabled) {
      console.log(`- ${s.title} (${c}) -> Set enabled = false`);
    } else {
      console.log(`- (${c}) -> Already disabled or not found`);
    }
  });

  console.log("\n✅ DRY RUN COMPLETE. NO DATABASE MODIFICATIONS WERE MADE.");
}

run();
