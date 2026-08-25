import { getDb } from '@/data/db';
import { notFound } from 'next/navigation';
import ImageGallery from '@/components/ImageGallery';
import ProductCard from '@/components/ProductCard';
import ProductCarousel from '@/components/ProductCarousel';
import { ShoppingCart, ShieldCheck, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const db = await getDb();
  const product = db.products.find(p => p.id === resolvedParams.id);
  if (!product) return { title: 'Product Not Found' };
  
  const desc = product.metaDescription || product.description.substring(0, 160) || `تسوق ${product.title} بأفضل سعر في مصر على بكام النهاردة.`;
  const imgUrl = (product.images && product.images.length > 0) ? product.images[0] : product.image;

  return {
    title: `${product.title} | بكام النهاردة`,
    description: desc,
    alternates: {
      canonical: `/product/${product.id}`,
    },
    openGraph: {
      title: `${product.title} | بكام النهاردة`,
      description: desc,
      url: `/product/${product.id}`,
      images: imgUrl ? [{ url: imgUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | بكام النهاردة`,
      description: desc,
      images: imgUrl ? [imgUrl] : undefined,
    }
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

  const parsePrice = (p: string) => parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
  const currPriceNum = parsePrice(product.price);
  const origPriceNum = product.originalPrice ? parsePrice(product.originalPrice) : null;
  const discountPercent = (origPriceNum && origPriceNum > currPriceNum) 
    ? Math.round(((origPriceNum - currPriceNum) / origPriceNum) * 100) 
    : null;

  const formatPrice = (priceStr: string) => {
    if (!priceStr) return null;
    const match = priceStr.match(/([\d,]+)\.(\d{2})/);
    if (match && match.index !== undefined) {
      const full = match[0];
      const intPart = match[1];
      const fracPart = match[2];
      const before = priceStr.substring(0, match.index);
      const after = priceStr.substring(match.index + full.length);
      return (
        <>
          {before}{intPart}
          <span style={{ fontSize: '0.65em', color: '#ffffff', verticalAlign: 'sub', margin: '0 2px' }}>
            {fracPart}
          </span>
          {after}
        </>
      );
    }
    return priceStr;
  };

  // Format Description into paragraphs
  const descriptionParagraphs = product.description.split('\n').filter(p => p.trim() !== '');

  // ── 1. "المنتجات المرتبطة بهذه السلعة" (Same Category) ──
  const relatedProducts = db.products
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 8);

  // ── 2. "منتجات مشابهة قد تهمك" (Deterministic PRNG Product ID Seed) ──
  const similarRandom = getSeededRandom(product.id);
  const shuffledForSimilar = [...db.products.filter(p => p.id !== product.id)];
  for (let i = shuffledForSimilar.length - 1; i > 0; i--) {
    const j = Math.floor(similarRandom() * (i + 1));
    [shuffledForSimilar[i], shuffledForSimilar[j]] = [shuffledForSimilar[j], shuffledForSimilar[i]];
  }
  const similarProducts = shuffledForSimilar.slice(0, 8);

  // ── 3. "منتجات قد تعجبك أيضًا" (Deterministic PRNG Product ID + 'liked' Seed, favor high rating) ──
  const likedRandom = getSeededRandom(product.id + 'liked');
  const validProductsForLiked = db.products.filter(p => p.id !== product.id);
  validProductsForLiked.sort((a, b) => {
    const rA = parseFloat(a.rating) || 0;
    const rB = parseFloat(b.rating) || 0;
    return rB - rA;
  });
  const topRated = validProductsForLiked.slice(0, 30);
  for (let i = topRated.length - 1; i > 0; i--) {
    const j = Math.floor(likedRandom() * (i + 1));
    [topRated[i], topRated[j]] = [topRated[j], topRated[i]];
  }
  const likedProducts = topRated.slice(0, 8);


  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": allImages,
    "description": product.metaDescription || product.description.substring(0, 200),
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "غير محدد"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://bkamelnaharda.vercel.app/product/${product.id}`,
      "priceCurrency": "EGP",
      "price": currPriceNum,
      "availability": "https://schema.org/InStock"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "الرئيسية",
        "item": "https://bkamelnaharda.vercel.app/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": product.category,
        "item": `https://bkamelnaharda.vercel.app/?category=${encodeURIComponent(product.category)}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.title,
        "item": `https://bkamelnaharda.vercel.app/product/${product.id}`
      }
    ]
  };

  return (
    <div dir="rtl" className="bg-gray-50 min-h-screen pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      
      {/* Breadcrumb */}
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

        {/* ── PRODUCT HERO ── */}
        <div className="product-hero">

          {/* Gallery column */}
          <div className="product-hero-gallery">
            <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
              <ImageGallery images={allImages} title={product.title} />
            </div>
          </div>

          {/* Info column */}
          <div className="product-hero-info">

            {/* Product Title */}
            <h1 className="product-title-text">
              {product.title}
            </h1>

            {/* Pricing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {product.originalPrice && origPriceNum && origPriceNum > currPriceNum && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#9ca3af' }} className="product-price-label">
                    السعر السابق: <span style={{ textDecoration: 'line-through' }}>{product.originalPrice}</span>
                  </span>
                  {discountPercent && (
                    <span style={{
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      خصم {discountPercent}%
                    </span>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="product-price-label">السعر الحالي:</span>
                <span className="product-price-current">
                  {formatPrice(product.price)}
                </span>
              </div>
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

        {/* Recommendation Sections */}
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          <ProductCarousel title="المنتجات المرتبطة بهذه السلعة" products={relatedProducts} />
          <ProductCarousel title="منتجات مشابهة قد تهمك" products={similarProducts} />
          <ProductCarousel title="منتجات قد تعجبك أيضًا" products={likedProducts} />

        </div>

      </div>
    </div>
  );
}
