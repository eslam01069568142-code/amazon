import Link from 'next/link';
import { Search, ShoppingCart } from 'lucide-react';
import { Suspense } from 'react';
import CategorySlider from './CategorySlider';
import styles from './Header.module.css';
import { supabaseAdmin } from '@/data/db';
import { unstable_cache } from 'next/cache';
import SearchBar from './SearchBar';
import { createClient } from '@supabase/supabase-js';

const getCachedCategories = unstable_cache(
  async () => {
    // Create a scoped client that bypasses Next.js aggressive fetch cache for the raw query.
    // The result is still safely cached by unstable_cache above.
    const supabaseAdminLocal = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        global: {
          fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
        }
      }
    );
    
    const { data } = await supabaseAdminLocal
      .from('sections')
      .select('id, title, type, category, enabled, order_index')
      .eq('enabled', true)
      .not('category', 'is', null)
      .order('order_index', { ascending: true });
      
    // Deduplicate by category ID to ensure we show all unique categories
    const uniqueCategories: any[] = [];
    const seen = new Set();
    for (const row of data || []) {
      if (row.category && !seen.has(row.category)) {
        seen.add(row.category);
        uniqueCategories.push(row);
      }
    }
    return uniqueCategories;
  },
  ['header-sections'],
  { tags: ['sections'], revalidate: 60 } // Revalidate every 60s to prevent permanent empty cache
);

export default async function Header() {
  const rows = await getCachedCategories();
  const catSections = rows.map((row: any) => ({
    id: `nav_${row.id}`,
    title: row.title,
    category: row.category,
  }));

  return (
    <header className={styles.header}>
      {/* Top Bar (Logo Only) */}
      <div className="container">
        <div className={styles.topBar}>
          <Link href="/" className={styles.logo}>
            <ShoppingCart size={32} />
            <span>بكام النهاردة</span>
          </Link>
        </div>
      </div>

      {/* Hero Search Section */}
      <div className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>قارن واكتشف أفضل الأسعار من أمازون مصر</h1>
          
          <SearchBar />
        </div>
      </div>
      
      {/* Navigation Menu */}
      <Suspense fallback={<div className={styles.sliderNav} style={{ height: '70px' }} />}>
        <CategorySlider sections={catSections} />
      </Suspense>
    </header>
  );
}
