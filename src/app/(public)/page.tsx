import ProductCard from '@/components/ProductCard';
import ProductCarousel from '@/components/ProductCarousel';
import { getDb } from '@/data/db';
import { Tag, Zap, ArrowLeft, Clock, Shirt, HeartPulse, Dumbbell, Smartphone, Home as HomeIcon, Gamepad2, Briefcase, Car, Sparkles, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

function getCategoryTheme(title: string, category: string) {
  const t = (title + ' ' + category).toLowerCase();
  
  if (t.includes('أزياء') || t.includes('موضة') || t.includes('ملابس') || t.includes('حقائب') || t.includes('أحذية')) {
    return {
      Icon: Shirt,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      bgLight: '#fdf2f8',
      borderColor: '#fbcfe8',
      textColor: '#be185d'
    };
  }
  if (t.includes('صحة') || t.includes('جمال') || t.includes('عناية')) {
    return {
      Icon: HeartPulse,
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      bgLight: '#ecfdf5',
      borderColor: '#a7f3d0',
      textColor: '#047857'
    };
  }
  if (t.includes('رياضة') || t.includes('لياقة')) {
    return {
      Icon: Dumbbell,
      gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
      bgLight: '#fff7ed',
      borderColor: '#fed7aa',
      textColor: '#c2410c'
    };
  }
  if (t.includes('إلكترونيات') || t.includes('أجهزة') || t.includes('ساعات') || t.includes('طابعات')) {
    return {
      Icon: Smartphone,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      bgLight: '#eff6ff',
      borderColor: '#bfdbfe',
      textColor: '#1d4ed8'
    };
  }
  if (t.includes('منزل') || t.includes('مطبخ') || t.includes('ديكور') || t.includes('تخزين')) {
    return {
      Icon: HomeIcon,
      gradient: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)',
      bgLight: '#fefce8',
      borderColor: '#fef08a',
      textColor: '#a16207'
    };
  }
  if (t.includes('ألعاب') || t.includes('ترفيه')) {
    return {
      Icon: Gamepad2,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      bgLight: '#f5f3ff',
      borderColor: '#ddd6fe',
      textColor: '#6d28d9'
    };
  }
  if (t.includes('مكتب') || t.includes('مدرسية')) {
    return {
      Icon: Briefcase,
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
      bgLight: '#ecfeff',
      borderColor: '#a5f3fc',
      textColor: '#0e7490'
    };
  }
  if (t.includes('سيار') || t.includes('سيارات')) {
    return {
      Icon: Car,
      gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      bgLight: '#fef2f2',
      borderColor: '#fecaca',
      textColor: '#b91c1c'
    };
  }

  return {
    Icon: Sparkles,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    bgLight: '#eef2ff',
    borderColor: '#c7d2fe',
    textColor: '#4338ca'
  };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string, q?: string }> }): Promise<Metadata> {
  const resolvedParams = await searchParams;
  
  if (resolvedParams.category) {
    return {
      title: `${resolvedParams.category} | بكام النهاردة`,
      description: `اكتشف وقارن أفضل أسعار وعروض ${resolvedParams.category} في مصر على بكام النهاردة.`,
      alternates: {
        canonical: `/?category=${encodeURIComponent(resolvedParams.category)}`,
      },
      openGraph: {
        title: `${resolvedParams.category} | بكام النهاردة`,
        description: `اكتشف وقارن أفضل أسعار وعروض ${resolvedParams.category} في مصر على بكام النهاردة.`,
        url: `/?category=${encodeURIComponent(resolvedParams.category)}`,
      }
    };
  }
  
  if (resolvedParams.q) {
    return {
      title: `نتائج البحث عن: ${resolvedParams.q} | بكام النهاردة`,
      robots: { index: false, follow: true }
    };
  }

  return {
    alternates: {
      canonical: '/',
    }
  };
}
// Simple deterministic PRNG based on a string seed
function getSeededRandom(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  let seed = h;
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Helper to parse price string to number for comparison
function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  // Remove currency symbols, commas, and arabic text, keeping only digits and dots
  const numericStr = priceStr.replace(/[^\d.]/g, '');
  return numericStr ? parseFloat(numericStr) : 0;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string, q?: string }> }) {
  const resolvedParams = await searchParams;
  const db = await getDb();

  // ── 0. Search View ──
  if (resolvedParams.q) {
    const { searchProducts } = await import('@/lib/search');
    const filtered = searchProducts(db.products, resolvedParams.q);
    
    return (
      <div className="container animate-fade-in">
        <section className="section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <h2 className="text-2xl" style={{ marginBottom: '2rem' }}>
            نتائج البحث عن: "{resolvedParams.q}"
          </h2>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              لم يتم العثور على أي منتجات مطابقة لبحثك.
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

  // ── 1. Category Page View ──
  if (resolvedParams.category) {
    const categoryInfo = db.sections.find(s => s.type === 'products_by_category' && s.category === resolvedParams.category);
    const categoryName = categoryInfo ? categoryInfo.title : resolvedParams.category;
    
    // Include child categories
    const childCats = db.sections.filter(c => c.parentId === resolvedParams.category).map(c => c.category);
    const validCats = [resolvedParams.category, ...childCats];
    const filtered = db.products.filter(p => p.category && validCats.includes(p.category));
    
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

  const enabledSections = db.sections.filter(s => s.enabled);
  const banners = enabledSections.filter(s => s.type === 'banner').sort((a, b) => a.order - b.order);
  const featuredCategories = enabledSections.filter(s => s.isFeatured).sort((a, b) => a.order - b.order);
  
  // -- A. Automatic Daily Deals --
  // Use Africa/Cairo time to generate a stable seed for the current calendar day
  const dailySeed = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const random = getSeededRandom(dailySeed);
  
  // Separate discounted vs non-discounted products
  const discountedProducts: typeof db.products = [];
  const normalProducts: typeof db.products = [];
  
  db.products.forEach(p => {
    const pPrice = parsePrice(p.price);
    const pOrig = parsePrice(p.originalPrice);
    if (pPrice > 0 && pOrig > pPrice) {
      discountedProducts.push(p);
    } else if (pPrice > 0) {
      normalProducts.push(p);
    }
  });
  
  // Deterministic shuffle using the PRNG
  const shuffle = (array: typeof db.products) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  
  const shuffledDiscounted = shuffle(discountedProducts);
  let finalDailyDeals = [...shuffledDiscounted];
  
  // Target between 4 and 8 products (also determined by the seed)
  const targetCount = Math.floor(random() * 5) + 4; // 4 to 8
  
  if (finalDailyDeals.length < targetCount) {
    const shuffledNormal = shuffle(normalProducts);
    finalDailyDeals = finalDailyDeals.concat(shuffledNormal);
  }
  finalDailyDeals = finalDailyDeals.slice(0, targetCount);

  // -- B. Automatic New Arrivals --
  const newArrivals = [...db.products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  // -- C. Automatic Category Sections --
  const categorySections = enabledSections
    .filter(s => s.type === 'products_by_category')
    .sort((a, b) => a.order - b.order);

  // -- D. Manual/Promotional Sections --
  const manualSections = enabledSections
    .filter(s => s.type !== 'products_by_category' && s.type !== 'banner' && s.type !== 'daily_deals' && s.type !== 'new_arrivals')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="container animate-fade-in">
      

      {/* 1. Banners */}
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

      {/* 1.5 Shop by Category (8 Parent Categories UI Revamp) */}
      {(() => {
        const parentCategories = enabledSections.filter(s => s.type === 'products_by_category' && !s.parentId).slice(0, 8);
        if (parentCategories.length === 0) return null;
        
        return (
          <section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 className="text-xl" style={{ margin: 0, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🏷️</span> تصفح الفئات الرئيسية
              </h2>
            </div>
            <div className="category-revamped-grid">
              <style dangerouslySetInnerHTML={{__html: `
                .category-revamped-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 1rem;
                }
                @media (max-width: 1024px) {
                  .category-revamped-grid {
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.85rem;
                  }
                }
                @media (max-width: 768px) {
                  .category-revamped-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                  }
                }
                @media (max-width: 480px) {
                  .category-revamped-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.65rem;
                  }
                }
                .category-revamped-card {
                  display: flex;
                  align-items: center;
                  gap: 0.85rem;
                  padding: 0.9rem 1rem;
                  border-radius: 1rem;
                  text-decoration: none;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.04);
                  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
                  position: relative;
                  overflow: hidden;
                }
                .category-revamped-card:hover {
                  transform: translateY(-3px);
                  box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1);
                }
                .category-icon-badge {
                  width: 44px;
                  height: 44px;
                  border-radius: 0.85rem;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #ffffff;
                  flex-shrink: 0;
                  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                  transition: transform 0.22s ease;
                }
                .category-revamped-card:hover .category-icon-badge {
                  transform: scale(1.08) rotate(-4deg);
                }
                .category-text-container {
                  flex-grow: 1;
                  min-width: 0;
                  display: flex;
                  flex-direction: column;
                  gap: 0.15rem;
                }
                .category-card-name {
                  margin: 0;
                  font-size: 0.95rem;
                  font-weight: 800;
                  color: #0f172a;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  line-height: 1.3;
                }
                .category-card-subtitle {
                  font-size: 0.73rem;
                  font-weight: 700;
                  display: flex;
                  align-items: center;
                  gap: 0.2rem;
                }
              `}} />
              {parentCategories.map(cat => {
                const theme = getCategoryTheme(cat.title, cat.category || '');
                const IconComponent = theme.Icon;
                
                return (
                  <Link
                    key={cat.id}
                    href={`/?category=${cat.category}`}
                    className="category-revamped-card"
                    style={{
                      background: theme.bgLight,
                      border: `1.5px solid ${theme.borderColor}`
                    }}
                  >
                    <div className="category-icon-badge" style={{ background: theme.gradient }}>
                      <IconComponent size={22} />
                    </div>
                    <div className="category-text-container">
                      <h3 className="category-card-name">{cat.title}</h3>
                      <span className="category-card-subtitle" style={{ color: theme.textColor }}>
                        تصفح العروض <ChevronLeft size={12} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* 2. Daily Deals */}
      {finalDailyDeals.length > 0 && (
        <section className="section" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Zap size={28} color="#eab308" />
            <h2 className="text-2xl" style={{ margin: 0 }}>عروض اليوم</h2>
          </div>
          <ProductCarousel title="" products={finalDailyDeals} />
        </section>
      )}

      {/* 3. New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="section" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Clock size={28} color="var(--accent-color)" />
            <h2 className="text-2xl" style={{ margin: 0 }}>وصل حديثاً</h2>
          </div>
          <ProductCarousel title="" products={newArrivals} />
        </section>
      )}

      {/* 4. Automatic Category Sections — Carousel (Limited to 4 to avoid clutter) */}
      {categorySections.slice(0, 4).map(section => {
        const childCats = db.sections.filter(c => c.parentId === section.category).map(c => c.category);
        const validCats = [section.category, ...childCats];
        const catProducts = db.products.filter(p => p.category && validCats.includes(p.category)).slice(0, 20);
        if (catProducts.length === 0) return null;

        return (
          <section key={section.id} className="section" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
              <span />
              <Link
                href={`/?category=${section.category}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none', marginBottom: '0.5rem' }}
              >
                عرض الكل <ArrowLeft size={16} />
              </Link>
            </div>
            <ProductCarousel title={section.title} products={catProducts} />
          </section>
        );
      })}

      {/* 5. Existing Manual/Promotional Sections */}
      {manualSections.map(section => {
        let sectionProducts: any[] = [];
        
        if (section.type === 'manual_products') {
          if (section.productIds && section.productIds.length > 0) {
            sectionProducts = db.products.filter(p => section.productIds!.includes(p.id));
          }
        } else if (section.type === 'category_section') {
          if (section.category) {
            sectionProducts = db.products.filter(p => p.category === section.category).slice(0, 8);
          }
        } else if (section.type === 'best_sellers' || section.type === 'recommended') {
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
            <ProductCarousel title="" products={sectionProducts} />
          </section>
        );
      })}

    </div>
  );
}
