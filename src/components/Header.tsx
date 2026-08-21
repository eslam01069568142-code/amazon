import Link from 'next/link';
import { Search, ShoppingCart } from 'lucide-react';
import { Suspense } from 'react';
import CategorySlider from './CategorySlider';
import styles from './Header.module.css';
import { supabaseAdmin } from '@/data/db';
import { unstable_cache } from 'next/cache';

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
      .eq('type', 'products_by_category')
      .eq('enabled', true)
      .order('order_index', { ascending: true });
    return data || [];
  },
  ['header-sections'],
  { tags: ['sections'] }
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
          
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="ابحث عن منتج، ماركة، أو فئة..." 
              className={styles.searchInput}
            />
            <Search className={styles.searchIcon} size={24} />
            <button className={styles.searchButton}>بحث</button>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <Suspense fallback={<div className={styles.sliderNav} style={{ height: '70px' }} />}>
        <CategorySlider sections={catSections} />
      </Suspense>
    </header>
  );
}
