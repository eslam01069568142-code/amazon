const fs = require('fs');

const path = 'scripts/import-3-per-subcategory.js';
let code = fs.readFileSync(path, 'utf8');

// Replace generateId() call with ASIN
const oldInsertBlock = `        const productId = generateId();

        // Log immediately`;

const newInsertBlock = `        const productId = prod.asin ? 'prod_' + prod.asin : generateId();

        // Safe Upsert Check
        const { data: existingProd } = await supabase.from('products').select('id').eq('id', productId).single();
        if (existingProd) {
           // Skip insertion, just log
           console.log(\`[Skipped: Duplicate ASIN \${prod.asin}]\`);
           continue;
        }

        // Log immediately`;

code = code.replace(oldInsertBlock, newInsertBlock);
fs.writeFileSync(path, code);
console.log('Successfully patched import-3-per-subcategory.js to use canonical ASIN ID!');
