'use client';

import React, { useState, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/data/db';

interface HomepageProductGridProps {
  products: Product[];
  categories: string[];
}

export default function HomepageProductGrid({ products, categories }: HomepageProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('الكل');

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'الكل') {
      // Return a balanced mix or just all (let's say all, maybe max 40 for performance)
      return products.slice(0, 40);
    }
    return products.filter(p => p.category === activeCategory).slice(0, 40);
  }, [products, activeCategory]);

  return (
    <section className="section" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 className="text-2xl" style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
          تصفح أفضل العروض
        </h2>
      </div>

      {/* Interactive Category Chips */}
      <div className="filter-chips-container" dir="rtl">
        <style dangerouslySetInnerHTML={{__html: `
          .filter-chips-container {
            display: flex;
            gap: 0.75rem;
            overflow-x: auto;
            padding-bottom: 1rem;
            margin-bottom: 1rem;
            scrollbar-width: none; /* Firefox */
          }
          .filter-chips-container::-webkit-scrollbar {
            display: none; /* Safari and Chrome */
          }
          .filter-chip {
            white-space: nowrap;
            padding: 0.5rem 1.25rem;
            border-radius: 999px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            border: 2px solid #e2e8f0;
            background: #ffffff;
            color: #64748b;
            transition: all 0.2s ease;
          }
          .filter-chip:hover {
            border-color: #cbd5e1;
            background: #f8fafc;
          }
          .filter-chip.active {
            background: #1e1b4b;
            border-color: #1e1b4b;
            color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(30, 27, 75, 0.2);
          }
          
          .interactive-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.25rem;
          }
          @media (max-width: 1024px) {
            .interactive-grid { grid-template-columns: repeat(3, 1fr); gap: 1rem; }
          }
          @media (max-width: 768px) {
            .interactive-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          }
          @media (max-width: 480px) {
            .interactive-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
          }
        `}} />
        
        <button 
          className={`filter-chip ${activeCategory === 'الكل' ? 'active' : ''}`}
          onClick={() => setActiveCategory('الكل')}
        >
          الكل
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="interactive-grid">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          لا توجد منتجات متاحة في هذا القسم حالياً.
        </div>
      )}
    </section>
  );
}
