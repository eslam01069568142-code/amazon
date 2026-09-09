'use client';

import React, { useState, useEffect } from 'react';

const heroSlides = [
  {
    icon: '🌟',
    title: 'دليلك الذكي لأقوى العروض وتوفير فلوسك في مصر',
    subtitle: 'بنفحص الأسعار ونرشح لك أفضل صفقات المتاجر المعتمدة مع الشحن الرسمي والدفع عند الاستلام.'
  },
  {
    icon: '🛡️',
    title: 'مراجعات وتحليل ذكي بحيادية تامة',
    subtitle: 'نكشف لك المميزات والعيوب بصدق بناءً على تجارب المشترين لمساعدتك على الاختيار الأمثل.'
  },
  {
    icon: '🚚',
    title: 'تنفيذ وشحن رسمي موثوق 100%',
    subtitle: 'طلبك يصلك مباشرة عبر أسطول الشحن المعتمد لضمان سرعة وسلامة التوصيل.'
  },
  {
    icon: '💵',
    title: 'دفع عند الاستلام وإرجاع سهل ومضمون',
    subtitle: 'تسوق براحة بال تامة مع نفس سياسات الضمان وحماية المشتري المعتمدة رسمياً.'
  }
];

export default function HomepageHero() {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="homepage-hero-wrapper">
      <style dangerouslySetInnerHTML={{__html: `
        .homepage-hero-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .hero-banner {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          border-radius: 1.5rem;
          padding: 1.5rem 1rem;
          text-align: center;
          color: white;
          box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.4);
          position: relative;
          overflow: hidden;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .hero-banner::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 20% 150%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% -50%, rgba(99, 102, 241, 0.2) 0%, transparent 50%);
        }
        .hero-title {
          font-size: 1.7rem;
          font-weight: 900;
          margin-bottom: 0.25rem;
          position: relative;
          z-index: 1;
          line-height: 1.3;
        }
        .hero-subtitle {
          font-size: 0.85rem;
          color: #c7d2fe;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }
        .slide-content {
          transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
        }
        .slide-icon {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 1.25rem;
          }
          .hero-subtitle {
            font-size: 0.75rem;
          }
          .hero-banner {
            padding: 1.25rem 1rem;
            min-height: 150px;
          }
          .slide-icon {
            font-size: 1.25rem;
          }
        }
      `}} />
      
      {/* 1. Hero Banner */}
      <div className="hero-banner">
        <div key={slideIndex} className="slide-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
          <div className="slide-icon">{heroSlides[slideIndex].icon}</div>
          <h1 style={{ color: '#ffffff' }} className="hero-title text-white text-center drop-shadow-sm">
            {heroSlides[slideIndex].title}
          </h1>
          <p className="hero-subtitle">
            {heroSlides[slideIndex].subtitle}
          </p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
