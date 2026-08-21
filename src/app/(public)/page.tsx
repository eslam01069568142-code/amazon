import ProductCard from '@/components/ProductCard';
import { getDb } from '@/data/db';
import { Tag, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const resolvedParams = await searchParams;
  const db = await getDb();

  // ── 1. Category Page View ──
  // When a user clicks on a category in the header dropdown or "View All" button
  if (resolvedParams.category) {
    const categoryInfo = db.sections.find(s => s.type === 'products_by_category' && s.category === resolvedParams.category);
    const categoryName = categoryInfo ? categoryInfo.title : resolvedParams.category;
    const filtered = db.products.filter(p => p.category === resolvedParams.category);
    
    return (
      <div className="container animate-fade-in">
        <section className="section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <h2 className="text-2xl" style={{ marginBottom: '2rem' }}>
            {categoryName}
          </h2>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              لا توجد منتجات في هذا القسم حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-4">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── 2. Homepage View ──

  const enabledSections = db.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  // 2a. Fetch Banners
  const banners = enabledSections.filter(s => s.type === 'banner');

  // 2b. Fetch Active Daily Deals
  const now = new Date();
  const activeDeals = db.dailyDeals.filter(d => {
    if (!d.enabled) return false;
    if (d.startDate && new Date(d.startDate) > now) return false;
    if (d.endDate && new Date(d.endDate) < now) return false;
    return true;
  }).sort((a, b) => a.order - b.order);

  const dailyDealProducts = activeDeals.map(deal => {
    const prod = db.products.find(p => p.id === deal.productId);
    if (!prod) return null;
    return {
      ...prod,
      originalPrice: deal.offerPrice ? prod.price : (prod.originalPrice || prod.price),
      price: deal.offerPrice || prod.price,
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);

  // 2c. Prepare Homepage Sections (Excluding Categories and Banners which are handled separately)
  const homepageSections = enabledSections.filter(s => 
    s.type !== 'products_by_category' && s.type !== 'banner'
  ).sort((a,b) => a.order - b.order);

  return (
    <div className="container animate-fade-in">
      
      {/* ── Banners ── */}
      {banners.map(section => (
        <section key={section.id} className="section" style={{ paddingBottom: '2rem' }}>
          <div style={{
            backgroundColor: 'var(--surface-color)', padding: '2rem',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{ backgroundColor: 'var(--accent-color)', color: 'white', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <Tag size={32} />
            </div>
            <div>
              <h2 className="text-2xl" style={{ marginBottom: '0.5rem' }}>{section.title}</h2>
              <p className="text-muted">اكتشف أحدث التخفيضات والصفقات الحصرية من أمازون مصر اليوم.</p>
            </div>
          </div>
        </section>
      ))}

      {/* ── Homepage Sections ── */}
      {homepageSections.map(section => {
        
        // 1. Daily Deals Special Case
        if (section.type === 'daily_deals') {
          if (dailyDealProducts.length === 0) return null;
          return (
            <section key={section.id} className="section" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Zap size={28} color="#eab308" />
                <h2 className="text-2xl" style={{ margin: 0 }}>{section.title}</h2>
              </div>
              <div className="grid grid-cols-4">
                {dailyDealProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        }

        // 2. Standard Products Resolution
        let sectionProducts: any[] = [];
        
        if (section.type === 'manual_products') {
          if (section.productIds && section.productIds.length > 0) {
            sectionProducts = db.products.filter(p => section.productIds!.includes(p.id));
          }
        } else if (section.type === 'category_section') {
          if (section.category) {
            sectionProducts = db.products.filter(p => p.category === section.category).slice(0, 8);
          }
        } else if (section.type === 'new_arrivals') {
          sectionProducts = [...db.products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
        } else if (section.type === 'best_sellers' || section.type === 'recommended') {
          // No real sales/recommendation data exists yet, so hide it gracefully as instructed.
          sectionProducts = [];
        } else if (section.type === 'all_products') {
          sectionProducts = db.products.slice(0, 16);
        }

        if (sectionProducts.length === 0) return null;

        return (
          <section key={section.id} className="section" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="text-2xl" style={{ margin: 0 }}>{section.title}</h2>
              {section.type === 'category_section' && (
                <Link 
                  href={`/?category=${section.category}`} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}
                >
                  عرض الكل <ArrowLeft size={16} />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-4">
              {sectionProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}

    </div>
  );
}
