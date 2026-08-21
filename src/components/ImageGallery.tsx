'use client';
import { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [mainImgIndex, setMainImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMainImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMainImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <div className="gallery-container">
        {/* Main Image */}
        <div 
          className="gallery-main bg-white rounded-2xl shadow-sm p-4 cursor-pointer" 
          style={{ border: '1px solid var(--border-color)' }}
          onClick={() => setIsLightboxOpen(true)}
        >
          <img 
            src={images[mainImgIndex]} 
            alt={title} 
            style={{ maxHeight: '450px', objectFit: 'contain', width: '100%', height: '100%' }} 
          />
        </div>
        
        {/* Thumbnails (Only if > 1 image) */}
        {images.length > 1 && (
          <div className="gallery-thumbnails">
            {images.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setMainImgIndex(i)}
                className={`gallery-thumb ${mainImgIndex === i ? 'active' : ''}`}
                style={{
                  border: mainImgIndex === i ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  padding: '0.4rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <img src={img} alt={`${title} thumbnail ${i+1}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Full-screen viewer */}
      {isLightboxOpen && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            flexDirection: 'column'
          }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            onClick={() => setIsLightboxOpen(false)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '0.5rem' }}
          >
            <X size={32} />
          </button>

          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {images.length > 1 && (
              <button 
                onClick={handlePrev}
                style={{ position: 'absolute', right: '2rem', color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '1rem', zIndex: 10 }}
              >
                <ChevronRight size={40} />
              </button>
            )}

            <img 
              src={images[mainImgIndex]} 
              alt={title} 
              style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} 
              onClick={(e) => e.stopPropagation()}
            />

            {images.length > 1 && (
              <button 
                onClick={handleNext}
                style={{ position: 'absolute', left: '2rem', color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '1rem', zIndex: 10 }}
              >
                <ChevronLeft size={40} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
