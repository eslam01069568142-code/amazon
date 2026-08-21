import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("Starting migration...");
  
  const dbPath = path.join(__dirname, '..', 'src', 'data', 'db.backup.json');
  if (!fs.existsSync(dbPath)) {
    console.error("Backup file not found at", dbPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(rawData);

  console.log(`Found ${db.products?.length || 0} products`);
  console.log(`Found ${db.sections?.length || 0} sections`);
  console.log(`Found ${db.dailyDeals?.length || 0} daily deals`);

  // Migrate Settings
  if (db.settings) {
    const settings = {
      id: 1,
      tracking_id: db.settings.trackingId,
      facebook_pixel_id: db.settings.facebookPixelId,
      social_links: db.settings.socialLinks || []
    };
    const { error } = await supabase.from('settings').upsert(settings);
    if (error) console.error("Error migrating settings:", error);
    else console.log("Migrated settings.");
  }

  // Migrate Products
  if (db.products && db.products.length > 0) {
    const products = db.products.map(p => ({
      id: p.id,
      original_url: p.originalUrl,
      title: p.title,
      description: p.description,
      meta_description: p.metaDescription,
      price: p.price,
      original_price: p.originalPrice,
      image: p.image,
      images: p.images || [],
      rating: p.rating,
      category: p.category,
      created_at: p.createdAt
    }));
    const { error } = await supabase.from('products').upsert(products);
    if (error) console.error("Error migrating products:", error);
    else console.log(`Migrated ${products.length} products.`);
  }

  // Migrate Sections
  if (db.sections && db.sections.length > 0) {
    const sections = db.sections.map(s => ({
      id: s.id,
      title: s.title,
      type: s.type,
      category: s.category,
      product_ids: s.productIds || [],
      enabled: s.enabled,
      order_index: s.order
    }));
    const { error } = await supabase.from('sections').upsert(sections);
    if (error) console.error("Error migrating sections:", error);
    else console.log(`Migrated ${sections.length} sections.`);
  }

  // Migrate Daily Deals
  if (db.dailyDeals && db.dailyDeals.length > 0) {
    const deals = db.dailyDeals.map(d => ({
      id: d.id,
      product_id: d.productId,
      offer_price: d.offerPrice,
      start_date: d.startDate,
      end_date: d.endDate,
      enabled: d.enabled,
      order_index: d.order
    }));
    const { error } = await supabase.from('daily_deals').upsert(deals);
    if (error) console.error("Error migrating daily deals:", error);
    else console.log(`Migrated ${deals.length} daily deals.`);
  }

  console.log("Migration complete!");
}

migrate();
