import ProductCard from '@/components/ProductCard';
import { supabase } from '@/data/db';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'منتجات ماي واي | بكام النهاردة',
  description: 'تصفح أحدث عروض ومنتجات ماي واي عبر موقع بكام النهاردة.',
};

export const revalidate = 60;

export default async function MyWayPage() {
  // Fetch My Way products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_my_way', true)
    .order('created_at', { ascending: false });

  const mappedProducts = (products || []).map((p: any) => ({
    id: p.id,
    originalUrl: p.original_url,
    title: p.title,
    description: p.description,
    price: p.price,
    originalPrice: p.original_price,
    image: p.image,
    images: p.images || [],
    rating: p.rating,
    category: p.category,
    isMyWay: p.is_my_way,
    createdAt: p.created_at,
  }));

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Sparkles size={28} color="#ec4899" />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>منتجات ماي واي</h1>
      </div>
      
      {mappedProducts.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: 'var(--radius-lg)', color: '#64748b' }}>
          لا توجد منتجات ماي واي حالياً.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}>
          {mappedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
