import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { scrapeAndInsertProduct } from '@/utils/scraper';
import * as cheerio from 'cheerio';

const AUTOMATION_CRON_SECRET = process.env.AUTOMATION_CRON_SECRET ?? '';

async function logAutomation(level: string, message: string, sectionId?: string, asin?: string) {
  try {
    await supabaseAdmin.from('automation_logs').insert([{
      level,
      message,
      section_id: sectionId,
      asin,
    }]);
  } catch (e) {
    console.error('Failed to write log', e);
  }
}

async function searchAmazonForCategory(query: string, page: number) {
  try {
    const searchUrl = `https://www.amazon.eg/-/en/s?k=${encodeURIComponent(query)}&page=${page}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Amazon search returned ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const asins: string[] = [];

    $('.s-result-item[data-asin]').each((_, el) => {
      const asin = $(el).attr('data-asin');
      if (asin && asin.length === 10) {
        asins.push(asin);
      }
    });

    return [...new Set(asins)]; // Unique ASINs
  } catch (e) {
    console.error('Search Amazon error:', e);
    return [];
  }
}

export async function GET(req: Request) {
  try {
    // 1. Verify Secret
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const secret = searchParams.get('secret') || (authHeader ? authHeader.replace('Bearer ', '') : '');
    
    if (secret !== AUTOMATION_CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Read State
    const { data: state, error: stateError } = await supabaseAdmin
      .from('automation_state')
      .select('*')
      .eq('id', 'singleton')
      .single();

    if (stateError || !state) {
      return NextResponse.json({ error: 'Automation state not initialized' }, { status: 500 });
    }

    if (state.status !== 'running') {
      return NextResponse.json({ skipped: true, reason: 'Not running', status: state.status });
    }

    // 3. Check next_run_at
    const now = new Date();
    if (state.next_run_at) {
      const nextRun = new Date(state.next_run_at);
      if (now < nextRun) {
        return NextResponse.json({ skipped: true, reason: 'Waiting for next run window' });
      }
    }

    // 4. Acquire Lock atomically
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    
    // We try to update locked_at = now IF (locked_at is null OR locked_at < 10 mins ago)
    const { data: lockData, error: lockError } = await supabaseAdmin
      .from('automation_state')
      .update({ locked_at: now.toISOString() })
      .eq('id', 'singleton')
      .or(`locked_at.is.null,locked_at.lt.${tenMinsAgo}`)
      .select('id')
      .single();

    if (lockError || !lockData) {
      return NextResponse.json({ skipped: true, reason: 'Worker is currently locked/running' });
    }

    // --- LOCK ACQUIRED ---
    
    // Helper to release lock and set next run
    const releaseLock = async (delayMinutes: number, updates: any = {}) => {
      const nextRunAt = new Date(now.getTime() + delayMinutes * 60 * 1000).toISOString();
      await supabaseAdmin.from('automation_state').update({
        ...updates,
        locked_at: null,
        last_run_at: now.toISOString(),
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString()
      }).eq('id', 'singleton');
    };

    // Calculate random delay between 5 and 12 minutes
    const randomDelay = Math.floor(Math.random() * (12 - 5 + 1)) + 5;

    // 5. Fetch Sections to determine order
    const { data: sections } = await supabaseAdmin
      .from('sections')
      .select('id, title, category, parent_id')
      .eq('type', 'products_by_category')
      .order('order_index', { ascending: true });

    if (!sections || sections.length === 0) {
      await logAutomation('error', 'No product sections found in database');
      await releaseLock(5); // retry in 5 mins
      return NextResponse.json({ error: 'No sections' });
    }

    let currentSectionId = state.current_section_id;
    let currentPage = state.current_page || 1;
    let productsImported = state.section_products_imported || 0;

    let sectionIndex = sections.findIndex(s => s.id === currentSectionId);
    if (sectionIndex === -1) {
      sectionIndex = 0;
      currentSectionId = sections[0].id;
      currentPage = 1;
      productsImported = 0;
    }

    const currentSection = sections[sectionIndex];

    // 6. Search Amazon
    await logAutomation('info', `Searching Amazon for: ${currentSection.title} (Page ${currentPage})`, currentSection.id);
    const asins = await searchAmazonForCategory(currentSection.title, currentPage);

    if (asins.length === 0) {
      await logAutomation('warning', `No ASINs found on page ${currentPage}. Advancing page.`, currentSection.id);
      
      let nextUpdates = {};
      if (currentPage >= 5) { // Max 5 pages per category
        const nextIdx = (sectionIndex + 1) % sections.length;
        nextUpdates = {
          current_section_id: sections[nextIdx].id,
          current_page: 1,
          section_products_imported: 0
        };
        await logAutomation('info', `Reached page 5, moving to next section: ${sections[nextIdx].title}`);
      } else {
        nextUpdates = { current_page: currentPage + 1 };
      }
      
      await releaseLock(randomDelay, nextUpdates);
      return NextResponse.json({ success: true, action: 'page_advanced', delay: randomDelay });
    }

    // 7. Deduplication
    const { data: existingProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .in('id', asins.map(a => `prod_${a}`));

    const existingIds = new Set(existingProducts?.map(p => p.id) || []);
    const newAsins = asins.filter(a => !existingIds.has(`prod_${a}`));

    let totalSkipped = state.total_skipped || 0;
    totalSkipped += (asins.length - newAsins.length);

    if (newAsins.length === 0) {
      await logAutomation('warning', `All ${asins.length} products on page ${currentPage} already exist.`, currentSection.id);
      
      let nextUpdates = {};
      if (currentPage >= 5) {
        const nextIdx = (sectionIndex + 1) % sections.length;
        nextUpdates = {
          current_section_id: sections[nextIdx].id,
          current_page: 1,
          section_products_imported: 0,
          total_skipped: totalSkipped
        };
      } else {
        nextUpdates = { current_page: currentPage + 1, total_skipped: totalSkipped };
      }

      await releaseLock(randomDelay, nextUpdates);
      return NextResponse.json({ success: true, action: 'all_duplicates_page_advanced', delay: randomDelay });
    }

    // 8. Import ONE product
    const targetAsin = newAsins[0];
    const productUrl = `https://www.amazon.eg/dp/${targetAsin}`;

    // Fetch tracking ID
    const { data: settingsData } = await supabaseAdmin.from('settings').select('tracking_id').limit(1).single();
    const trackingId = settingsData?.tracking_id || '';

    await logAutomation('info', `Attempting to import ASIN: ${targetAsin}`, currentSection.id, targetAsin);

    const result = await scrapeAndInsertProduct(productUrl, false, trackingId, sections, currentSection.category);

    if (!result.success) {
      await logAutomation('error', `Failed to import ${targetAsin}: ${result.error}`, currentSection.id, targetAsin);
      
      await releaseLock(randomDelay, { 
        total_failed: (state.total_failed || 0) + 1,
        total_skipped: totalSkipped 
      });
      return NextResponse.json({ success: false, error: result.error, delay: randomDelay });
    }

    await logAutomation('success', `Successfully imported ${result.product?.title?.substring(0, 50)}...`, currentSection.id, targetAsin);

    // 9. Update state for 3 products limit
    let nextUpdates: any = {
      total_imported: (state.total_imported || 0) + 1,
      total_skipped: totalSkipped,
      section_products_imported: productsImported + 1,
      current_section_id: currentSectionId,
      current_page: currentPage
    };

    if (nextUpdates.section_products_imported >= 3) {
      // Reached 3 products for this category, move to next!
      const nextIdx = (sectionIndex + 1) % sections.length;
      nextUpdates.current_section_id = sections[nextIdx].id;
      nextUpdates.current_page = 1;
      nextUpdates.section_products_imported = 0;
      await logAutomation('info', `Imported 3 products for ${currentSection.title}. Moving to next section.`);
    }

    await releaseLock(randomDelay, nextUpdates);
    
    return NextResponse.json({ 
      success: true, 
      action: 'imported', 
      asin: targetAsin, 
      delay: randomDelay,
      next_section: nextUpdates.current_section_id
    });

  } catch (error) {
    console.error('Automation worker error', error);
    // Try to blindly release lock if it fails completely
    try {
      await supabaseAdmin.from('automation_state').update({ locked_at: null }).eq('id', 'singleton');
    } catch (e) {}
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
