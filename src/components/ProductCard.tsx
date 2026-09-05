import Link from 'next/link';
import { Star, ArrowLeft, Zap } from 'lucide-react';
import type { Product } from '@/data/db';
import { parseNumericPrice, formatDisplayPrice, calculateOriginalDiscount } from '@/utils/price';
import { generateSlug } from '@/utils/slugs';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const currPriceNum = parseNumericPrice(product.price);
  const origPriceNum = parseNumericPrice(product.originalPrice);
  const discountPct = calculateOriginalDiscount(currPriceNum, origPriceNum);
  const formattedPrice = formatDisplayPrice(currPriceNum, product.price);
  
  const isNoon = product.originalUrl?.toLowerCase().includes('noon') || product.isMyWay === true;
  const storeName = isNoon ? 'نون مصر' : 'أمازون مصر';

  return (
    <div className="product-card-modern">
      <style dangerouslySetInnerHTML={{__html: `
        .product-card-modern {
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .product-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }
        .product-card-link-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          text-decoration: none;
          color: inherit;
        }
        .product-card-image-box {
          height: 160px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          position: relative;
        }
        .product-card-badge-container {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.25rem;
          z-index: 2;
        }
        .product-card-discount-tag {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 0.18rem 0.5rem;
          border-radius: 0.375rem;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }
        .product-card-compare-tag {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #ffedd5;
          font-size: 0.64rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 999px;
          margin-right: auto;
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }
        .product-card-img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.25s ease;
        }
        .product-card-modern:hover .product-card-img {
          transform: scale(1.04);
        }
        .product-card-details {
          padding: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex-grow: 1;
          background-color: #ffffff;
        }
        .product-card-heading {
          font-size: 0.86rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.35;
          height: 2.7em;
          margin: 0;
          color: #0f172a;
          font-weight: 700;
        }
        .product-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.1rem;
        }
        .product-card-rating-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #eab308;
          font-size: 0.73rem;
          font-weight: 600;
        }
        .product-card-store-badges {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .store-chip {
          font-size: 0.62rem;
          font-weight: 800;
          padding: 0.08rem 0.35rem;
          border-radius: 0.25rem;
        }
        .chip-amazon {
          background-color: #fefce8;
          color: #854d0e;
          border: 1px solid #fef08a;
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }
        .chip-noon {
          background-color: #fff7ed;
          color: #c2410c;
          border: 1px solid #ffedd5;
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }
        .product-card-price-section {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          margin-top: auto;
          padding-top: 0.5rem;
        }
        .product-card-price-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.7rem;
        }
        .price-title-text {
          color: #64748b;
          font-weight: 600;
        }
        .price-strike-text {
          color: #94a3b8;
          text-decoration: line-through;
        }
        .product-card-main-price {
          color: #059669;
          font-size: 1.15rem;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .price-disclaimer-text {
          font-size: 0.55rem;
          color: #94a3b8;
          margin-top: 0.1rem;
        }
        .product-card-cta-button {
          margin-top: 0.55rem;
          padding: 0.55rem 0.85rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
          transition: background 0.2s ease;
        }
        .product-card-modern:hover .product-card-cta-button {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
        }
        .btn-noon {
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
          box-shadow: 0 2px 4px rgba(202, 138, 4, 0.2);
          color: #1e1b4b;
        }
        .product-card-modern:hover .btn-noon {
          background: linear-gradient(135deg, #ca8a04 0%, #a16207 100%);
          color: #ffffff;
        }
      `}} />
      <Link href={`/product/${product.id}/${generateSlug(product.title)}`} className="product-card-link-wrapper">
        <div className="product-card-image-box">
          <div className="product-card-badge-container">
            {discountPct !== null && (
              <span className="product-card-discount-tag">
                وفر {discountPct}%
              </span>
            )}
            {currPriceNum !== null && origPriceNum !== null && origPriceNum > currPriceNum && (
              <span className="product-card-compare-tag">
                وفر {origPriceNum - currPriceNum} جنيه
              </span>
            )}
          </div>
          <img 
            src={product.image} 
            alt={product.title} 
            className="product-card-img"
          />
        </div>
        
        <div className="product-card-details">
          <h3 className="product-card-heading">
            {product.title}
          </h3>
          
          <div className="product-card-meta">
            <div className="product-card-rating-badge">
              <Star size={12} fill="currentColor" />
              <span style={{ color: '#64748b' }}>{product.rating || '4.5'}</span>
            </div>
            <div className="product-card-store-badges">
              {isNoon ? (
                <span className="store-chip chip-noon">
                  <span style={{ fontSize: '10px' }}>📦</span> نون مصر
                </span>
              ) : (
                <span className="store-chip chip-amazon">
                  <span style={{ fontSize: '10px' }}>📦</span> أمازون مصر
                </span>
              )}
            </div>
          </div>
          
          <div className="product-card-price-section">
            <div className="product-card-price-label">
              <span className="price-title-text">أفضل سعر متوفر:</span>
              {discountPct !== null && origPriceNum !== null && (
                <span className="price-strike-text">
                  {formatDisplayPrice(origPriceNum, product.originalPrice)}
                </span>
              )}
            </div>
            <div className="product-card-main-price">
              {formattedPrice}
            </div>
            <div className="price-disclaimer-text">
              * الأسعار متغيرة على {storeName}
            </div>
            <div className={`product-card-cta-button ${isNoon ? 'btn-noon' : ''}`}>
              <span>عرض العرض على {storeName}</span>
              <ArrowLeft size={14} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

