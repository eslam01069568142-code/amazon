import Link from 'next/link';
import { Search, ShoppingCart } from 'lucide-react';
import { Suspense } from 'react';
import CategorySlider from './CategorySlider';
import styles from './Header.module.css';
import { supabaseAdmin } from '@/data/db';
import { unstable_cache } from 'next/cache';

const getCachedCategories = unstable_cache(
  async () => {
    const { data } = await supabaseAdmin
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
