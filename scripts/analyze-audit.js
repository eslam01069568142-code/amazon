const fs = require('fs');

const data = JSON.parse(fs.readFileSync('audit-data.json', 'utf-8'));
const { sections, products } = data;

// Find all categorization scripts in `scripts/`
const scripts = fs.readdirSync('./scripts');
console.log("Categorization Scripts Found:", scripts.filter(s => s.includes('categor') || s.includes('fix') || s.includes('align') || s.includes('organize') || s.includes('remove') || s.includes('restore')));

console.log("\n================ CATEGORY STATISTICS ================");
// Build tree
const parents = sections.filter(s => !s.parent_id && s.category);
const tree = {};

sections.forEach(s => {
  if (s.category && !s.parent_id) {
    tree[s.category] = { title: s.title, children: [], pCount: 0 };
  }
});

sections.forEach(s => {
  if (s.category && s.parent_id && tree[s.parent_id]) {
    tree[s.parent_id].children.push({ id: s.category, title: s.title, pCount: 0 });
  }
});

const sectionMap = {};
sections.forEach(s => {
  if (s.category) sectionMap[s.category] = s;
});

// Calculate product counts
let uncategorized = [];
let orphanProducts = [];
products.forEach(p => {
  if (!p.category) {
    uncategorized.push(p);
  } else if (!sectionMap[p.category]) {
    orphanProducts.push(p);
  } else {
    // find in tree
    const sec = sectionMap[p.category];
    if (!sec.parent_id && tree[p.category]) {
      tree[p.category].pCount++;
    } else if (sec.parent_id && tree[sec.parent_id]) {
      const child = tree[sec.parent_id].children.find(c => c.id === p.category);
      if (child) child.pCount++;
    }
  }
});

for (const [key, parent] of Object.entries(tree)) {
  console.log(`${parent.title} (${key}) - ${parent.pCount} products directly`);
  parent.children.forEach(c => {
    console.log(`  ├── ${c.title} (${c.id}) - ${c.pCount} products`);
  });
}

console.log("\n================ ORPHAN CATEGORIES ================");
const orphans = sections.filter(s => s.parent_id && !sectionMap[s.parent_id]);
console.log(orphans.map(o => `${o.title} (${o.category}) - Parent: ${o.parent_id}`).join('\n') || "None");

console.log("\n================ EMPTY CATEGORIES ================");
const empty = [];
for (const [key, parent] of Object.entries(tree)) {
  if (parent.pCount === 0 && parent.children.length === 0) empty.push(parent.title);
  parent.children.forEach(c => {
    if (c.pCount === 0) empty.push(`Sub: ${c.title}`);
  });
}
console.log(empty.join('\n') || "None");

console.log("\n================ DUPLICATE CATEGORIES ================");
const titles = {};
sections.forEach(s => {
  if (s.category) {
    if (!titles[s.title]) titles[s.title] = [];
    titles[s.title].push(s.category);
  }
});
for (const [t, cats] of Object.entries(titles)) {
  if (cats.length > 1) console.log(`Duplicate Title: ${t} -> ${cats.join(', ')}`);
}

console.log("\n================ UNCATEGORIZED PRODUCTS ================");
console.log(uncategorized.map(p => p.title).join('\n') || "None");

console.log("\n================ PRODUCTS IN ORPHAN/NON-EXISTENT CATS ================");
console.log(orphanProducts.map(p => `${p.title} -> ${p.category}`).join('\n') || "None");

// Classification heuristics check (simulated)
console.log("\n================ MISCLASSIFIED CHECK ================");
let correct = 0;
let wrongSub = [];
let wrongMain = [];

products.forEach(p => {
  if (!p.category || !sectionMap[p.category]) return;
  const c = p.category;
  const t = p.title.toLowerCase();
  
  // Very rough heuristic check
  if (t.includes('صلصال') && c !== 'cat_6k6saayuh') {
    wrongMain.push({ title: p.title, current: c, suggested: 'cat_6k6saayuh', reason: 'Contains صلصال' });
  } else if (t.includes('كاميرا') && c !== 'cat_cameras') {
    wrongMain.push({ title: p.title, current: c, suggested: 'cat_cameras', reason: 'Contains كاميرا' });
  } else {
    correct++;
  }
});

console.log(`Total Products: ${products.length}`);
console.log(`Correct (Heuristic): ${correct}`);
console.log("Wrong Subcategory/Main: " + JSON.stringify(wrongMain, null, 2));

