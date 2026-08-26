import Link from 'next/link';
import { Search } from 'lucide-react';
import { Suspense } from 'react';
import CategorySlider from './CategorySlider';
import styles from './Header.module.css';
import { supabaseAdmin } from '@/data/db';
import { unstable_cache } from 'next/cache';
import SearchBar from './SearchBar';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

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
      .select('id, title, type, category, enabled, order_index, parent_id, icon')
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
  
  // Group categories for Mega Menu
  const parentCategories = rows.filter((r: any) => !r.parent_id);
  const catSections = parentCategories.map((parent: any) => ({
    id: `nav_${parent.id}`,
    title: parent.title,
    category: parent.category,
    icon: parent.icon,
    children: rows
      .filter((r: any) => r.parent_id === parent.category)
      .map((child: any) => ({
        id: `nav_${child.id}`,
        title: child.title,
        category: child.category,
        icon: child.icon,
      }))
  }));

  return (
    <header className={styles.header}>
      {/* Top Bar: Logo + Search */}
      <div className={styles.topBarWrapper}>
        <div className={`container ${styles.topBarInner}`}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.png" alt="Bkam El-Naharda Logo" width={80} height={80} style={{ objectFit: 'contain' }} priority />
          </Link>
          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>
        </div>
      </div>
      
      {/* Navigation Bar (Dark/Black) */}
      <div className={styles.navBarWrapper}>
        <div className={`container ${styles.navBarInner}`}>
          <Suspense fallback={<div className={styles.navBarSkeleton} />}>
            <CategorySlider sections={catSections} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
