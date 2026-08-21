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
  
  return (
    <div className="card">
      <Link href={`/product/${product.id}`} style={{ display: 'block' }}>
        <div style={{ height: '240px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <img 
            src={product.image} 
            alt={product.title} 
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
          <h3 className="text-lg" style={{ 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            lineHeight: 1.4,
            height: '2.8em',
            margin: 0
          }}>
            {product.title}
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308' }}>
            <Star size={16} fill="currentColor" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{product.rating}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {showOriginalPrice && (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                السعر السابق: <span style={{ textDecoration: 'line-through' }}>{product.originalPrice}</span>
              </span>
            )}
            <div style={{ fontWeight: 800, color: 'var(--danger-color)', fontSize: '1.25rem' }}>
               {product.price}
            </div>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
            عرض التفاصيل
          </button>
        </div>
      </Link>
    </div>
  );
}
