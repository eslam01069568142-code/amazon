import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log('=== Supabase Data Verification ===\n');

  // 1. Products
  const { data: products, error: pe } = await supabase.from('products').select('id, title, category');
  if (pe) { console.error('Products ERROR:', pe); } else {
    console.log(`✅ Products: ${products.length} records`);
    products.forEach(p => console.log(`   - [${p.id}] ${p.title.substring(0,50)} | category: ${p.category}`));
  }

  // 2. Sections
  const { data: sections, error: se } = await supabase.from('sections').select('id, title, type, enabled, order_index').order('order_index');
  if (se) { console.error('Sections ERROR:', se); } else {
    console.log(`\n✅ Sections: ${sections.length} records`);
    sections.forEach(s => console.log(`   - [${s.id}] "${s.title}" type=${s.type} enabled=${s.enabled} order=${s.order_index}`));
  }

  // 3. Daily Deals
  const { data: deals, error: de } = await supabase.from('daily_deals').select('id, product_id, enabled');
  if (de) { console.error('Daily Deals ERROR:', de); } else {
    console.log(`\n✅ Daily Deals: ${deals.length} records`);
  }

  // 4. Settings
  const { data: settings, error: ste } = await supabase.from('settings').select('*').limit(1).single();
  if (ste) { console.error('Settings ERROR:', ste); } else {
    console.log(`\n✅ Settings:`);
    console.log(`   - trackingId: "${settings.tracking_id}"`);
    console.log(`   - facebookPixelId: "${settings.facebook_pixel_id || '(empty)'}"`);
    console.log(`   - socialLinks: ${JSON.stringify(settings.social_links)}`);
  }

  console.log('\n=== Verification Complete ===');
}

verify();
