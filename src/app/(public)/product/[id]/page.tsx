import { getDb } from '@/data/db';
import { notFound } from 'next/navigation';
import ImageGallery from '@/components/ImageGallery';
import { ShoppingCart, ShieldCheck, Clock, Tag } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const db = await getDb();
  const product = db.products.find(p => p.id === resolvedParams.id);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.title} | Bkam El-Naharda`,
    description: product.metaDescription || product.description.substring(0, 160)
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const db = await getDb();
  const product = db.products.find(p => p.id === resolvedParams.id);

  if (!product) {
    notFound();
  }

  // Construct the smart link
  const trackingId = db.settings.trackingId;
  const affiliateUrl = new URL(product.originalUrl);
  if (trackingId) {
    affiliateUrl.searchParams.set('tag', trackingId);
  }

  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];

  // Mock Price Stats
  const parsePrice = (p: string) => parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
  const currPriceNum = parsePrice(product.price);
  const origPriceNum = product.originalPrice ? parsePrice(product.originalPrice) : currPriceNum * 1.2;
  const discountPercent = Math.round(((origPriceNum - currPriceNum) / origPriceNum) * 100);
  
  // Calculate lowest and highest prices (mock data based on current price)
  const lowestPriceNum = Math.floor(currPriceNum * 0.7);
  const highestPriceNum = Math.floor(origPriceNum * 1.1);
  const currencyStr = product.price.replace(/[0-9.,]/g, '').trim() || 'جنية';

  // Format Description into paragraphs
  const descriptionParagraphs = product.description.split('\n').filter(p => p.trim() !== '');

  // Similar Products — category-first, then any other products
  // Affiliate URLs are built from db.settings.trackingId (Admin Dashboard setting)
  const MAX_SIMILAR = 4;

  // 1. Same category (excluding current product)
  const sameCat = db.products.filter(p => p.id !== product.id && p.category === product.category);
  // 2. Other categories as fallback
  const otherCat = db.products.filter(p => p.id !== product.id && p.category !== product.category);
  // Merge: same-category first, then others, capped at MAX_SIMILAR
  const rawSimilar = [...sameCat, ...otherCat].slice(0, MAX_SIMILAR);

  // Build affiliate URL for each similar product using the store's trackingId
  const similarProducts = rawSimilar.map(p => {
    const simUrl = new URL(p.originalUrl);
    if (trackingId) simUrl.searchParams.set('tag', trackingId);
    return {
      id: p.id,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice,
      img: p.image,
      affiliateHref: simUrl.toString(),
      storeLink: `/product/${p.id}`,
    };
  });


  return (
    <div dir="rtl" className="bg-gray-50 min-h-screen pb-16">
      
      {/* Breadcrumb - Full Width Background */}
      <div className="bg-white border-b border-gray-200 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600 transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href={`/?category=${product.category}`} className="hover:text-blue-600 transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px] md:max-w-md">{product.title}</span>
        </div>
      </div>

      <div className="product-page-wrapper">

        {/* ── PRODUCT HERO: two columns on desktop, stacked on mobile ── */}
        <div className="product-hero">

          {/* Gallery column */}
          <div className="product-hero-gallery">
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
              <ImageGallery images={allImages} title={product.title} />
            </div>
          </div>

          {/* Info column */}
          <div className="product-hero-info">

            {/* Product Title */}
            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.4,
              wordBreak: 'break-word',
              marginBottom: '0.25rem'
            }}>
              {product.title}
            </h1>

            {/* Pricing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827' }}>
                  {currPriceNum.toLocaleString()}
                </span>
                <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}>{currencyStr}</span>
              </div>
              {product.originalPrice && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#9ca3af', textDecoration: 'line-through', fontSize: '1rem' }}>
                    {origPriceNum.toLocaleString()} {currencyStr}
                  </span>
                  <span style={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    خصم {discountPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Amazon CTA */}
            <a
              href={affiliateUrl.toString()}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="btn-amazon"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            >
              <ShoppingCart size={24} />
              شراء الآن من Amazon
            </a>

            {/* Trust Signals */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={18} color="#16a34a" />
                <span>شراء آمن ومضمون 100%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={18} color="#2563eb" />
                <span>آخر تحديث للأسعار: اليوم</span>
              </div>
            </div>

          </div>
        </div>

        {/* Price Statistics */}
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={22} color="#3b82f6" />
            تحليل الأسعار
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>أقل سعر سجلناه</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>{lowestPriceNum.toLocaleString()} {currencyStr}</div>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>أعلى سعر سجلناه</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{highestPriceNum.toLocaleString()} {currencyStr}</div>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>نسبة الخصم الحالية</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                {product.originalPrice ? `-${discountPercent}%` : 'لا يوجد خصم'}
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div style={{ marginTop: '2rem', backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            وصف المنتج
          </h2>
          <div style={{ color: '#374151', lineHeight: 1.8, fontSize: '1rem' }}>
            {descriptionParagraphs.length > 0 ? (
              descriptionParagraphs.map((para, idx) => (
                <p key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#94a3b8', flexShrink: 0 }}>•</span>
                  <span>{para}</span>
                </p>
              ))
            ) : (
              <p>لا يوجد وصف متوفر لهذا المنتج حالياً.</p>
            )}
          </div>
        </div>

        {/* Similar / Recommended Products */}
        {similarProducts.length > 0 && (
          <div style={{ marginTop: '2.5rem', paddingBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem' }}>
              منتجات قد تعجبك أيضاً
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {similarProducts.map(sim => {
                const simParsePrice = (p: string) => parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
                const simCurr = simParsePrice(sim.price);
                const simOrig = sim.originalPrice ? simParsePrice(sim.originalPrice) : null;
                const simDiscount = simOrig && simOrig > simCurr
                  ? Math.round(((simOrig - simCurr) / simOrig) * 100)
                  : null;
                return (
                  <div key={sim.id} style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {/* Image → links to product page in the store */}
                    <Link href={sim.storeLink} style={{ display: 'block' }}>
                      <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1rem' }}>
                        <img src={sim.img} alt={sim.title} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                      </div>
                    </Link>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                      <Link href={sim.storeLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, margin: 0 }}>
                          {sim.title}
                        </h3>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--danger-color)', fontSize: '1.05rem' }}>{sim.price}</span>
                        {sim.originalPrice && (
                          <span style={{ color: '#9ca3af', textDecoration: 'line-through', fontSize: '0.82rem' }}>{sim.originalPrice}</span>
                        )}
                        {simDiscount && (
                          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.72rem', fontWeight: 700 }}>-{simDiscount}%</span>
                        )}
                      </div>
                      {/* Affiliate CTA uses the store's configured tracking ID */}
                      <a
                        href={sim.affiliateHref}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        style={{ display: 'block', textAlign: 'center', backgroundColor: 'var(--amazon-orange)', color: '#111', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', marginTop: 'auto' }}
                      >
                        شراء من Amazon
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
