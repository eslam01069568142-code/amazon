import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let modified = false;

const getBaseId = (url) => {
  const match = url.match(/\/I\/([^._]+)/);
  return match ? match[1] : url;
};

db.products.forEach(product => {
  if (product.images && product.images.length > 1) {
    const seenIds = new Set();
    const newImages = [];
    for (const url of product.images) {
      const id = getBaseId(url);
      if (!seenIds.has(id)) {
        seenIds.add(id);
        newImages.push(url);
      }
    }
    
    if (newImages.length !== product.images.length) {
      console.log(`Deduplicating images for product ${product.id}: ${product.images.length} -> ${newImages.length}`);
      product.images = newImages;
      modified = true;
    }
  }
});

if (modified) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('Database updated successfully with deduplicated images.');
} else {
  console.log('No duplicates found in database.');
}
