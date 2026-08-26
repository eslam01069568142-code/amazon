import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Product } from '@/data/db';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Extract number from rating e.g., "4.2 out of 5 stars" -> 4.2
  const ratingNum = parseFloat(product.rating) || 0;
  const parsePrice = (p: string) => parseFloat(p?.replace(/[^0-9.]/g, '')) || 0;
  const currPriceNum = parsePrice(product.price);
  const origPriceNum = product.originalPrice ? parsePrice(product.originalPrice) : null;
  const showOriginalPrice = origPriceNum && origPriceNum > currPriceNum;
  
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
          {before}
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{intPart}</span>
          <span style={{ fontSize: '0.65em', verticalAlign: 'super', margin: '0 2px' }}>
            .{fracPart}
          </span>
          {after}
        </>
      );
    }
    return (
      <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{priceStr}</span>
    );
  };

  return (
    <div className="card">
      <Link href={`/product/${product.id}`} style={{ display: 'block' }}>
        <div style={{ height: '180px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <img 
            src={product.image} 
            alt={product.title} 
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <h3 style={{ 
            fontSize: '0.9rem',
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            lineHeight: 1.4,
            height: '2.8em',
            margin: 0,
            color: 'var(--text-primary)',
            fontWeight: 600
          }}>
            {product.title}
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308', marginTop: '0.2rem' }}>
            <Star size={14} fill="currentColor" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{product.rating}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.4rem' }}>
            {showOriginalPrice && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                <span style={{ textDecoration: 'line-through' }}>{product.originalPrice}</span>
              </span>
            )}
            <div style={{ color: 'var(--danger-color)', lineHeight: '1.1' }}>
               {formatPrice(product.price)}
            </div>
          </div>
          
          {/* Subtle Amazon Branding Badge */}
          <div style={{
            alignSelf: 'flex-start',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '0.1rem 0.4rem',
            borderRadius: '0.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            marginTop: '0.2rem'
          }}>
            <span style={{ color: 'var(--amazon-orange)' }}>a</span> Amazon
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }}>
            عرض التفاصيل
          </button>
        </div>
      </Link>
    </div>
  );
}
