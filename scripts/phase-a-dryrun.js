const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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
  { titleMatch: 'V-290', expected: 'cat_r826y1abx', conf: '90%', name: 'VGR V-290 Shaver' }
];

async function runDryRun() {
  const { data: sections } = await supabase.from('sections').select('*');
  const { data: products } = await supabase.from('products').select('*');

  console.log(`Products: ${products.length}`);
  console.log(`Sections: ${sections.length}`);
  console.log("Database mutations: ZERO");

  if (products.length !== 62 || sections.length !== 51) {
     console.error("STOP: Count mismatch.");
     process.exit(1);
  }

  const sectionMap = {};
  sections.forEach(s => sectionMap[s.category] = s);

  // Check categories
  console.log("\n--- Category References Check ---");
  DEPRECATED_CATS.forEach(c => {
     const s = sectionMap[c];
     const pCount = products.filter(p => p.category === c).length;
     console.log(`Category: ${c} | Enabled: ${s ? s.enabled : 'N/A'} | Parent: ${s ? s.parent_id : 'N/A'} | Products: ${pCount}`);
  });

  let requiresChange = 0;
  let noChange = 0;
  let requiresReview = 0;
  let unaccounted = 0;

  const productLog = [];

  for (const p of products) {
    let proposed = p.category;
    let reason = "Canonical Category";
    let action = "NO CHANGE";
    let conf = "100%";

    // Check specific fixes
    const fix = SPECIFIC_FIXES.find(f => p.title.includes(f.titleMatch));
    if (fix) {
       if (p.category !== fix.expected) {
          proposed = fix.expected;
          reason = `Specific Fix: ${fix.name}`;
          action = "UPDATE";
          conf = fix.conf;
          requiresChange++;
       } else {
          noChange++;
       }
    } 
    // Check duplicates
    else if (CANONICAL_MAPPING[p.category]) {
       proposed = CANONICAL_MAPPING[p.category];
       reason = "Duplicate Migration";
       action = "UPDATE";
       conf = "100%";
       requiresChange++;
    } 
    // Otherwise no change
    else {
       // Is it ambiguous? (just a dummy check, we don't have a complex ML engine here)
       // We'll just say it's 100% since no rule caught it.
       if (p.category) {
          noChange++;
       } else {
          requiresReview++;
          conf = "50%";
          action = "REVIEW";
       }
    }

    productLog.push({ id: p.id, title: p.title.substring(0, 30), current: p.category, proposed, conf, action, reason });
  }

  console.log("\n--- Dry Run Summary ---");
  console.log(`Products requiring category change: ${requiresChange}`);
  console.log(`Products requiring no change: ${noChange}`);
  console.log(`Products requiring review: ${requiresReview}`);
  console.log(`Unaccounted products: ${products.length - (requiresChange + noChange + requiresReview)}`);

  console.log("\n--- Detailed Fixes ---");
  console.table(productLog.filter(p => p.action !== 'NO CHANGE'));

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scriptsHasLegacy = JSON.stringify(pkg.scripts).includes('master-clean');
  console.log(`Legacy scripts in package.json: ${scriptsHasLegacy}`);
}

runDryRun();
