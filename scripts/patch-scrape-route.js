const fs = require('fs');

const path = 'src/app/api/scrape/route.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Change existingProd check from aborting to marking as upsert
const oldCheck = `          const { data: existingProd } = await supabaseAdmin.from('products').select('id').eq('id', productId).single();
          if (existingProd) {
            results.push({ url: cleanUrl, success: false, status: 'Duplicate', error: 'Product already exists' });
            // If processing single URL, return immediately
            if (urlList.length === 1) return NextResponse.json({ success: false, status: 'Duplicate', error: 'المنتج موجود بالفعل' });
            continue;
          }`;

const newCheck = `          const { data: existingProd } = await supabaseAdmin.from('products').select('id, category').eq('id', productId).single();
          if (existingProd) {
            isUpsert = true;
            existingCategory = existingProd.category;
          }`;

code = code.replace(oldCheck, newCheck);
code = code.replace(`        if (asin && !isPreview) {`, `        let isUpsert = false;\n        let existingCategory = '';\n        if (asin && !isPreview) {`);

// 2. Adjust Category Priority 2 & 3: if upsert, reuse existing category
const oldCategory = `        if (!match) {
          match = findCategory([title, brand]);
        }`;

const newCategory = `        if (!match) {
          match = findCategory([title, brand]);
        }
        
        if (isUpsert && existingCategory) {
          // Keep existing category on upsert
          assignedCategoryId = existingCategory;
        }`;

// We insert this right after `let assignedCategoryId = '';`
code = code.replace(`        let assignedCategoryId = '';`, `        let assignedCategoryId = '';\n        if (isUpsert && existingCategory) { assignedCategoryId = existingCategory; }`);


// 3. Instead of batch insert at the end, we do upsert inside the loop for singles or modify the batch logic.
// Since the single URL block inserts directly, we change the single URL block to do upsert.
const oldSingleInsert = `          const { error } = await supabaseAdmin.from('products').insert([row]);
          if (error) {
            return NextResponse.json({ success: false, status: 'Failed', error: 'Database insert error' }, { status: 500 });
          }`;

const newSingleInsert = `          if (isUpsert) {
            const { error } = await supabaseAdmin.from('products').update({ price: product.price, original_price: product.originalPrice }).eq('id', product.id);
            if (error) return NextResponse.json({ success: false, status: 'Failed', error: 'Database update error' }, { status: 500 });
          } else {
            const { error } = await supabaseAdmin.from('products').insert([row]);
            if (error) return NextResponse.json({ success: false, status: 'Failed', error: 'Database insert error' }, { status: 500 });
          }`;

code = code.replace(oldSingleInsert, newSingleInsert);

// 4. Update Offers for Single URL
const oldSingleOffer = `          await supabaseAdmin.from('product_offers').insert([{
            id: offerId,
            product_id: product.id,
            store_id: 'store_amazon',
            price: offerPriceNum,
            original_price: offerOrigPriceNum,
            currency: 'EGP',
            product_url: product.originalUrl,
            affiliate_url: buildAmazonAffiliateUrl(product.originalUrl, trackingId),
            availability: 'in_stock',
            created_at: new Date().toISOString()
          }]);`;

const newSingleOffer = `          if (isUpsert) {
             const { data: existingOffer } = await supabaseAdmin.from('product_offers').select('id').eq('product_id', product.id).eq('store_id', 'store_amazon').single();
             if (existingOffer) {
               await supabaseAdmin.from('product_offers').update({ price: offerPriceNum, original_price: offerOrigPriceNum, updated_at: new Date().toISOString() }).eq('id', existingOffer.id);
             }
          } else {
            await supabaseAdmin.from('product_offers').insert([{
              id: offerId,
              product_id: product.id,
              store_id: 'store_amazon',
              price: offerPriceNum,
              original_price: offerOrigPriceNum,
              currency: 'EGP',
              product_url: product.originalUrl,
              affiliate_url: buildAmazonAffiliateUrl(product.originalUrl, trackingId),
              availability: 'in_stock',
              created_at: new Date().toISOString()
            }]);
          }`;

code = code.replace(oldSingleOffer, newSingleOffer);

fs.writeFileSync(path, code);
console.log('Successfully patched scrape/route.ts for Safe Upsert!');
