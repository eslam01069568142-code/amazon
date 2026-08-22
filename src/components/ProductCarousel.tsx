'use client';
import { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/data/db';

interface ProductCarouselProps {
  title: string;
  products: Product[];
}

export default function ProductCarousel({ title, products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showArrows, setShowArrows] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    
    const isScrollable = scrollWidth > clientWidth;
    setShowArrows(isScrollable);

    if (!isScrollable) {
      setAtStart(true);
      setAtEnd(true);
      return;
    }

    const absScrollLeft = Math.abs(scrollLeft);
    if (absScrollLeft <= 2) {
      setAtStart(true);
      setAtEnd(false);
    } else if (absScrollLeft + clientWidth >= scrollWidth - 2) {
      setAtStart(false);
      setAtEnd(true);
    } else {
      setAtStart(false);
      setAtEnd(false);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [products]);

  const scrollNext = () => {
    if (!atEnd && scrollRef.current) {
      scrollRef.current.scrollBy({ left: -600, behavior: 'smooth' });
    }
  };

  const scrollPrev = () => {
    if (!atStart && scrollRef.current) {
      scrollRef.current.scrollBy({ left: 600, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section style={{ position: 'relative', marginBottom: '2rem' }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {title}
          </h2>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {/* Navigation Layer - Perfectly aligns with the 180px image area */}
        {showArrows && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-16px',
            right: '-16px',
            height: '180px', // Matches the exact height of the product image in ProductCard
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none', // Allow clicking through to the cards below
            zIndex: 10
          }}>
            {/* Right Arrow (Previous in RTL) */}
            <button 
              onClick={scrollPrev}
              disabled={atStart}
              style={{
                pointerEvents: atStart ? 'none' : 'auto',
                opacity: atStart ? 0.5 : 1,
                width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff', 
                border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: atStart ? 'default' : 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#475569'
              }}
              aria-label="السابق"
            >
              <ChevronRight size={24} />
            </button>
            {/* Left Arrow (Next in RTL) */}
            <button 
              onClick={scrollNext}
              disabled={atEnd}
              style={{
                pointerEvents: atEnd ? 'none' : 'auto',
                opacity: atEnd ? 0.5 : 1,
                width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff', 
                border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: atEnd ? 'default' : 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#475569'
              }}
              aria-label="التالي"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
        )}

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ 
          display: 'flex', 
          gap: '1rem', 
          overflowX: 'auto', 
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none',  /* IE/Edge */
          paddingBottom: '0.5rem',
          margin: '0 -0.25rem',
          padding: '0 0.25rem'
        }}
        className="product-carousel-container"
      >
        <style dangerouslySetInnerHTML={{__html: `
          .product-carousel-container::-webkit-scrollbar {
            display: none;
          }
          .carousel-item {
            flex: 0 0 calc(25% - 0.75rem);
            scroll-snap-align: start;
          }
          @media (max-width: 1024px) {
            .carousel-item {
              flex: 0 0 calc(33.333% - 0.66rem);
            }
          }
          @media (max-width: 768px) {
            .carousel-item {
              flex: 0 0 calc(50% - 0.5rem);
            }
          }
          @media (max-width: 480px) {
            .carousel-item {
              flex: 0 0 85%;
            }
          }
        `}} />
        
        {products.map(p => (
          <div key={p.id} className="carousel-item">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
