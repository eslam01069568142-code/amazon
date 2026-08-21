'use client';
import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [mainImg, setMainImg] = useState(images[0]);

  if (!images || images.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="bg-white rounded-2xl shadow-sm p-6" style={{ display: 'flex', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
        <img src={mainImg} alt={title} style={{ maxHeight: '400px', objectFit: 'contain', width: '100%' }} />
      </div>
      
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {images.map((img, i) => (
            <button 
              key={i} 
              onClick={() => setMainImg(img)}
              style={{
                border: mainImg === img ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                minWidth: '80px',
                height: '80px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <img src={img} alt={`${title} thumbnail ${i+1}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
