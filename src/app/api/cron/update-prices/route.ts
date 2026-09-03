import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import * as cheerio from 'cheerio';
import { parseNumericPrice } from '@/utils/price';

// Allow max duration for Pro tier if applicable
export const maxDuration = 60; 

export async function GET(req: Request) {
  try {
    // 1. Verify Vercel Cron Secret (Authorization: Bearer CRON_SECRET)
    const authHeader = req.headers.get('authorization');
    
    // In local development, you might not have CRON_SECRET, but Vercel requires it for secure crons.
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch products to update (e.g. oldest updated first)
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, url, price')
      .like('url', '%amazon.eg%')
      .order('updated_at', { ascending: true })
      .limit(10); // Batch of 10 to prevent Vercel Serverless timeout

    if (!products || products.length === 0) {
      return NextResponse.json({ message: 'No products to update' });
    }

    let updatedCount = 0;
    
    // 3. Loop and fetch new prices
    for (const product of products) {
      try {
        const response = await fetch(product.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ar-AE,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          }
        });
        
        if (!response.ok) continue;
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Match standard Amazon price blocks
        const priceStr = $('.a-price .a-offscreen').first().text().trim() || 
                         $('#priceblock_ourprice').text().trim() ||
                         $('.a-price-whole').first().text().trim();
                         
        const numericPrice = parseNumericPrice(priceStr);
        
        if (numericPrice && numericPrice > 0) {
          // Compare with old price to avoid unnecessary writes, or just update the updated_at
          await supabaseAdmin
            .from('products')
            .update({ 
              price: numericPrice.toString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id);
            
          updatedCount++;
        } else {
          // Just update the timestamp so we don't keep polling a dead product immediately
          await supabaseAdmin
            .from('products')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', product.id);
        }
      } catch (err) {
        console.error(`Failed to update ${product.id}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized ${updatedCount}/${products.length} prices`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('CRON Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
