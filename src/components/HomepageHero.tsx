'use client';

import React from 'react';

export default function HomepageHero() {
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
        }
        .hero-banner::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 20% 150%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% -50%, rgba(99, 102, 241, 0.2) 0%, transparent 50%);
        }
        .hero-title {
          font-size: 1.875rem;
          font-weight: 900;
          margin-bottom: 0.25rem;
          position: relative;
          z-index: 1;
          line-height: 1.3;
        }
        .hero-subtitle {
          font-size: 0.875rem;
          color: #c7d2fe;
          max-width: 600px;
          margin: 0 auto 0.5rem auto;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }
        .search-container {
          max-width: 550px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .search-form {
          display: flex;
          background: white;
          border-radius: 999px;
          padding: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .search-input {
          flex-grow: 1;
          border: none;
          outline: none;
          padding: 0.5rem 1.25rem;
          font-size: 1.05rem;
          border-radius: 999px;
          color: #1e293b;
          background: transparent;
        }
        .search-btn {
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 999px;
          padding: 0.75rem 1.5rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .search-btn:hover {
          background: #d97706;
        }
        .quick-searches {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .quick-chip {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.35rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(4px);
        }
        .quick-chip:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 1.5rem;
          }
          .hero-subtitle {
            font-size: 0.75rem;
          }
          .hero-banner {
            padding: 1rem 1rem;
          }
        }
      `}} />
      
      {/* 1. Hero Banner */}
      <div className="hero-banner">
        <h1 style={{ color: '#ffffff' }} className="hero-title font-extrabold text-white text-center drop-shadow-sm">دليلك الذكي لأقوى العروض وتوفير فلوسك في مصر</h1>
        <p className="hero-subtitle text-blue-100">بنفحص الأسعار ونرشح لك أفضل صفقات أمازون ونون مع الشحن الرسمي والدفع عند الاستلام.</p>
      </div>

    </div>
  );
}
