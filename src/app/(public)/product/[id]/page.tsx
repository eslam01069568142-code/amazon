import { getDb, supabase } from '@/data/db';
import { getAmazonProductUrl } from '@/utils/amazon';
import { notFound } from 'next/navigation';
import ImageGallery from '@/components/ImageGallery';
import ProductCard from '@/components/ProductCard';
import ProductCarousel from '@/components/ProductCarousel';
import ProductPageInteractive from '@/components/ProductPageInteractive';
import { ShoppingCart, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { parseNumericPrice, formatDisplayPrice, calculateSavings, calculateOriginalDiscount, UnifiedOffer } from '@/utils/price';

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

  // Fetch store offers securely using public anon client and RLS
  const { data: storeOffers } = await supabase
    .from('product_offers')
    .select('*, stores(slug, name)')
    .eq('product_id', product.id);

  // Identify offers from database
  const noonOffers = storeOffers?.filter(o => o.stores?.name?.toLowerCase().includes('noon')) || [];
  const dbAmazonOffers = storeOffers?.filter(o => o.stores?.name?.toLowerCase().includes('amazon')) || [];
  
  // Amazon Fallback (for older products without product_offers entries)
  const trackingId = db.settings.trackingId;
  const hasAmazonInUrl = product.originalUrl && (product.originalUrl.toLowerCase().includes('amazon') || product.originalUrl.toLowerCase().includes('amzn.to'));
  
  const hasAmazonOffer = dbAmazonOffers.length > 0 || hasAmazonInUrl;
  const amazonAffiliateLink = dbAmazonOffers.length > 0 ? dbAmazonOffers[0].affiliate_url : getAmazonProductUrl(product, trackingId);

  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];

  // Brand Extraction Hierarchy
  let brandName = (product as any).brand || '';
  if (!brandName) {
    const brandMatch = product.description.match(/العلامة التجارية:\s*([^\n\r]+)/i);
    if (brandMatch && brandMatch[1]) {
      brandName = brandMatch[1].trim();
    }
  }
  if (!brandName) {
    const titleFirstWord = product.title.split(' ')[0];
    if (titleFirstWord && titleFirstWord.length > 2) {
      brandName = titleFirstWord;
    } else {
      brandName = 'عام';
    }
  }

  // Build a list of all valid offers
  const validDbOffers: UnifiedOffer[] = (storeOffers || []).map(o => ({
    id: o.id,
    storeName: o.stores?.name || 'متجر',
    price: parseNumericPrice(o.price),
    rawPrice: o.price,
    currency: o.currency || 'EGP',
    originalPrice: parseNumericPrice(o.original_price),
    rawOriginalPrice: o.original_price,
    url: o.affiliate_url || o.product_url
  })).filter(o => o.price !== null && o.price > 0);

  const hasDbAmazon = validDbOffers.some(o => o.storeName.toLowerCase().includes('amazon'));
  let validOffers = [...validDbOffers];

  const currLegacyPriceNum = parseNumericPrice(product.price);
  const origLegacyPriceNum = parseNumericPrice(product.originalPrice);

  if (!hasDbAmazon && hasAmazonInUrl && currLegacyPriceNum !== null) {
     validOffers.push({
       id: 'fallback-amazon',
       storeName: 'Amazon',
       price: currLegacyPriceNum,
       rawPrice: product.price,
       currency: 'EGP',
       originalPrice: origLegacyPriceNum,
       rawOriginalPrice: product.originalPrice,
       url: amazonAffiliateLink
     });
  }

  // Core Price Engine Calculations
  const { bestOffer, storeSavings, isMultipleOffers } = calculateSavings(validOffers);
  const displayPriceNum = bestOffer ? bestOffer.price : currLegacyPriceNum;
  const displayRawPrice = bestOffer ? (bestOffer.rawPrice || formatDisplayPrice(displayPriceNum, product.price)) : product.price;
  
  const displayOrigPriceNum = bestOffer ? (bestOffer.originalPrice ?? origLegacyPriceNum) : origLegacyPriceNum;
  const displayRawOrigPrice = bestOffer ? (bestOffer.rawOriginalPrice || (displayOrigPriceNum ? formatDisplayPrice(displayOrigPriceNum, product.originalPrice) : '')) : (product.originalPrice || '');
  
  const discountPercent = calculateOriginalDiscount(displayPriceNum, displayOrigPriceNum);
  const savingsInfo = storeSavings;

  const formatPrice = (priceVal: string | number | null | undefined) => {
    if (priceVal === null || priceVal === undefined) return null;
    const priceStr = String(priceVal);
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

  // ── Smart Recommendation Engine ──
  const titleWords = product.title.split(' ').slice(0, 3).map(w => w.toLowerCase());
  
  const scoreProduct = (p: typeof product) => {
    let score = 0;
    if (p.id === product.id) return -1;
    if (p.category === product.category) score += 10;
    
    const productCategoryInfo = db.sections.find(s => s.category === product.category);
    const pCategoryInfo = db.sections.find(s => s.category === p.category);
    if (productCategoryInfo?.parentId && pCategoryInfo?.parentId === productCategoryInfo.parentId) {
      score += 5;
    }

    const pTitle = p.title.toLowerCase();
    for (const w of titleWords) {
      if (w.length > 2 && pTitle.includes(w)) score += 3;
    }
    return score;
  };

  const scoredProducts = db.products
    .map(p => ({ product: p, score: scoreProduct(p) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // ── 1. "المنتجات المرتبطة بهذه السلعة" ──
  const relatedProducts = scoredProducts.slice(0, 8).map(i => i.product);

  // ── 2. "منتجات مشابهة قد تهمك" ──
  let similarProducts = scoredProducts.slice(8, 16).map(i => i.product);
  if (similarProducts.length < 8) {
    const similarRandom = getSeededRandom(product.id);
    const fallback = [...db.products.filter(p => p.id !== product.id && !relatedProducts.includes(p) && !similarProducts.includes(p))];
    for (let i = fallback.length - 1; i > 0; i--) {
      const j = Math.floor(similarRandom() * (i + 1));
      [fallback[i], fallback[j]] = [fallback[j], fallback[i]];
    }
    similarProducts = [...similarProducts, ...fallback.slice(0, 8 - similarProducts.length)];
  }

  // ── 3. "منتجات قد تعجبك أيضًا" ──
  const likedRandom = getSeededRandom(product.id + 'liked');
  const validProductsForLiked = db.products.filter(p => 
    p.id !== product.id && !relatedProducts.includes(p) && !similarProducts.includes(p)
  );
  validProductsForLiked.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
  const topRated = validProductsForLiked.slice(0, 30);
  for (let i = topRated.length - 1; i > 0; i--) {
    const j = Math.floor(likedRandom() * (i + 1));
    [topRated[i], topRated[j]] = [topRated[j], topRated[i]];
  }
  const likedProducts = topRated.slice(0, 8);


  let offersSchema: any;
  if (validOffers.length > 1) {
    const prices = validOffers.map(o => o.price!).filter(p => p !== null && p > 0);
    offersSchema = {
      "@type": "AggregateOffer",
      "url": `https://bkamelnaharda.vercel.app/product/${product.id}`,
      "priceCurrency": "EGP",
      "lowPrice": Math.min(...prices),
      "highPrice": Math.max(...prices),
      "offerCount": validOffers.length,
      "offers": validOffers.map(o => ({
         "@type": "Offer",
         "url": o.url,
         "priceCurrency": o.currency,
         "price": o.price,
         "availability": "https://schema.org/InStock"
      }))
    };
  } else if (displayPriceNum !== null && displayPriceNum > 0) {
    offersSchema = {
      "@type": "Offer",
      "url": `https://bkamelnaharda.vercel.app/product/${product.id}`,
      "priceCurrency": "EGP",
      "price": displayPriceNum,
      "availability": "https://schema.org/InStock"
    };
  }

  const isRealBrand = Boolean(brandName && brandName.trim() !== '' && brandName !== 'عام');

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": allImages,
    "description": product.metaDescription || product.description.substring(0, 200),
    "sku": product.id,
    ...(isRealBrand ? { "brand": { "@type": "Brand", "name": brandName } } : {}),
    ...(offersSchema ? { "offers": offersSchema } : {})
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
              {displayRawOrigPrice && displayOrigPriceNum && displayOrigPriceNum > displayPriceNum! && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#9ca3af' }} className="product-price-label">
                    السعر السابق: <span style={{ textDecoration: 'line-through' }}>{displayRawOrigPrice}</span>
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
                <span className="product-price-label">{isMultipleOffers ? 'يبدأ من:' : 'السعر الحالي:'}</span>
                <span className="product-price-current">
                  {formatPrice(displayRawPrice)}
                </span>
              </div>
            </div>

            {/* 🏆 BEST PRICE COMPARISON COMPONENT */}
            {isMultipleOffers && (
              <div style={{ margin: '1rem 0 1.5rem 0', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac', borderRadius: '0.75rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🏆</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534', margin: 0 }}>
                    أفضل سعر متوفر حالياً
                  </h3>
                </div>
                
                {savingsInfo && (
                  <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', marginBottom: '1rem', color: '#14532d', fontSize: '0.9rem', fontWeight: 700 }}>
                    🎉 وفر <span style={{ color: '#15803d', fontSize: '1.05rem' }}>{savingsInfo.amount} جنيه ({savingsInfo.percent}%)</span> عند الشراء من {bestOffer?.storeName || 'المتجر الأرخص'} مقارنة بـ {savingsInfo.comparedStore}!
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {validOffers.sort((a,b) => a.price! - b.price!).map((offer, idx) => {
                    const isBest = idx === 0;
                    return (
                      <div key={offer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: isBest ? '#ffffff' : 'rgba(255,255,255,0.7)', borderRadius: '0.5rem', border: isBest ? '2px solid #22c55e' : '1px solid #cbd5e1', boxShadow: isBest ? '0 2px 4px rgba(34,197,94,0.15)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{offer.storeName}</span>
                          {isBest && (
                            <span style={{ background: '#22c55e', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>
                              أقل سعر
                            </span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: isBest ? '#15803d' : '#334155' }}>
                              {offer.price} {offer.currency}
                            </span>
                            {offer.originalPrice && offer.originalPrice > offer.price! && (
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                {offer.originalPrice} EGP
                              </div>
                            )}
                          </div>

                          <a
                            href={offer.url}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            style={{ padding: '0.5rem 1rem', background: isBest ? '#16a34a' : '#2563eb', color: '#fff', borderRadius: '0.375rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}
                          >
                            شراء الآن
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Direct CTAs when single offer exists */}
            {!isMultipleOffers && (
              <>
                {hasAmazonOffer && (
                  <a
                    href={amazonAffiliateLink}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="btn-amazon"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}
                  >
                    <ShoppingCart size={24} />
                    شراء الآن من Amazon
                    {dbAmazonOffers.length > 0 && dbAmazonOffers[0].price && (
                       <span style={{ marginRight: 'auto', fontWeight: 800 }}>{dbAmazonOffers[0].price} {dbAmazonOffers[0].currency || 'EGP'}</span>
                    )}
                  </a>
                )}

                {noonOffers.map(noonOffer => (
                  <a
                    key={noonOffer.id}
                    href={noonOffer.affiliate_url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="btn-store-offer noon-cta"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: '#fef08a', color: '#854d0e', border: '1px solid #fde047', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, transition: 'all 0.2s', textDecoration: 'none', marginBottom: '0.75rem' }}
                  >
                    <ShoppingCart size={24} />
                    شراء الآن من نون
                    <span style={{ marginRight: 'auto', fontWeight: 800, color: '#a16207' }}>{noonOffer.price} {noonOffer.currency}</span>
                  </a>
                ))}
              </>
            )}

            {/* Trust Signals */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.875rem', color: '#4b5563', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={18} color="#16a34a" />
                <span>شراء آمن ومضمون 100%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={18} color="#2563eb" />
                <span>آخر تحديث للأسعار: اليوم</span>
              </div>
            </div>

            {/* Interactive Features: Price Alerts, History, & AI Summary */}
            <ProductPageInteractive
              productId={product.id}
              productTitle={product.title}
              currentPrice={displayPriceNum}
              displayPriceStr={formatDisplayPrice(displayPriceNum, product.price)}
              description={product.description}
              offers={validOffers.map(o => ({ storeName: o.storeName, price: o.price, url: o.url }))}
            />

          </div>
        </div>

        {/* ── AI PRODUCT SUMMARY & FEATURES ── */}
        <div style={{ marginTop: '2rem', backgroundColor: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e40af', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💡</span> ملخص مميزات المنتج
          </h2>
          <div style={{ color: '#1e3a8a', lineHeight: 1.8, fontSize: '0.95rem' }}>
            {descriptionParagraphs.length > 0 ? (
              <ul style={{ paddingRight: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {descriptionParagraphs.slice(0, 5).map((para, idx) => (
                  <li key={idx} style={{ fontWeight: 500 }}>{para}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>يحتوي هذا المنتج على التقييمات والأداء الممتاز من المتاجر الرسمية المتاحة.</p>
            )}
          </div>
        </div>


        {/* Full Product Description */}
        <div style={{ marginTop: '1.5rem', backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            الوصف التفصيلي
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
