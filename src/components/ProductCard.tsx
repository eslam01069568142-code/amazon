import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Product } from '@/data/db';
import { parseNumericPrice, formatDisplayPrice, calculateOriginalDiscount } from '@/utils/price';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const currPriceNum = parseNumericPrice(product.price);
  const origPriceNum = parseNumericPrice(product.originalPrice);
  const discountPct = calculateOriginalDiscount(currPriceNum, origPriceNum);
  const formattedPrice = formatDisplayPrice(currPriceNum, product.price);

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Link href={`/product/${product.id}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none' }}>
        <div style={{ height: '150px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
          {discountPct !== null && (
            <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
              خصم {discountPct}%
            </span>
          )}
          <img 
            src={product.image} 
            alt={product.title} 
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', flexGrow: 1, backgroundColor: '#fff' }}>
          <h3 style={{ 
            fontSize: '0.85rem',
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            lineHeight: 1.35,
            height: '2.7em',
            margin: 0,
            color: '#1e293b',
            fontWeight: 600
          }}>
            {product.title}
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308', marginTop: '0.1rem' }}>
            <Star size={12} fill="currentColor" />
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{product.rating || 'لا يوجد تقييم'}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: 'auto', paddingTop: '0.4rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
              أفضل سعر:
            </div>
            {discountPct !== null && origPriceNum !== null && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                <span style={{ textDecoration: 'line-through' }}>{formatDisplayPrice(origPriceNum, product.originalPrice)}</span>
              </span>
            )}
            <div style={{ color: currPriceNum !== null ? '#059669' : '#64748b', fontSize: '1rem', fontWeight: 800, lineHeight: '1.2' }}>
               {formattedPrice}
            </div>
            <div style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span>🔍 قارن الأسعار بين المتاجر</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
