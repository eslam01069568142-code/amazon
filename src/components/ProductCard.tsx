import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Product } from '@/data/db';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Extract number from rating e.g., "4.2 out of 5 stars" -> 4.2
  const ratingNum = parseFloat(product.rating) || 0;
  
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
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 className="text-lg" style={{ 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            height: '3em'
          }}>
            {product.title}
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308' }}>
            <Star size={16} fill="currentColor" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{product.rating}</span>
          </div>
          
          <div className="text-xl" style={{ fontWeight: 800, color: 'var(--danger-color)', display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
            {product.price}
            {product.originalPrice && (
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'line-through' }}>
                {product.originalPrice}
              </span>
            )}
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            عرض التفاصيل
          </button>
        </div>
      </Link>
    </div>
  );
}
