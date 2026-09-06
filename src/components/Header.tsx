import Link from 'next/link';
import styles from './Header.module.css';
import SearchBar from './SearchBar';
import Image from 'next/image';
import HeaderCategoriesDropdown from './HeaderCategoriesDropdown';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const getCachedCategories = unstable_cache(
  async () => {
    const supabaseAdminLocal = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
      }
    );
    
    const { data } = await supabaseAdminLocal
      .from('sections')
      .select('id, title, category, parent_id, icon')
      .eq('enabled', true)
      .eq('type', 'products_by_category')
      .not('category', 'is', null)
      .order('order_index', { ascending: true });
      
    const uniqueCategories: any[] = [];
    const seen = new Set();
    for (const row of data || []) {
      if (row.category && !seen.has(row.category) && row.title !== 'غير مصنف' && !row.parent_id) {
        seen.add(row.category);
        uniqueCategories.push(row);
      }
    }
    return uniqueCategories;
  },
  ['header-categories-dropdown'],
  { tags: ['sections'], revalidate: 60 }
);

export default async function Header() {
  const categories = await getCachedCategories();

  return (
    <header className={styles.header}>
      {/* Top Bar: Logo + Categories + Search */}
      <div className={styles.topBarWrapper}>
        <div className={`container ${styles.topBarInner}`}>
          <div className="flex items-center gap-6">
            <Link href="/" className={styles.logo}>
              <Image src="/logo.png" alt="Bkam El-Naharda Logo" width={80} height={80} style={{ objectFit: 'contain' }} priority />
            </Link>
            <div className="hidden md:block">
              <HeaderCategoriesDropdown categories={categories} />
            </div>
          </div>
          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>
          <div className="md:hidden">
            <HeaderCategoriesDropdown categories={categories} />
          </div>
        </div>
      </div>
    </header>
  );
}
