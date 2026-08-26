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
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Link href={`/product/${product.id}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none' }}>
        <div style={{ height: '150px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9' }}>
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
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{product.rating}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: 'auto', paddingTop: '0.4rem' }}>
            {showOriginalPrice && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                <span style={{ textDecoration: 'line-through' }}>{product.originalPrice}</span>
              </span>
            )}
            <div style={{ color: '#b91c1c', lineHeight: '1.1' }}>
               {formatPrice(product.price)}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
