'use client';

import React, { useState } from 'react';
import { Search, ShieldCheck, Truck, Banknote } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomepageHero() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const quickSearches = ["أجهزة المطبخ", "ماي واي", "باور بانك", "العناية بالبشرة"];

  return (
    <div className="homepage-hero-wrapper">
      <style dangerouslySetInnerHTML={{__html: `
        .homepage-hero-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .hero-banner {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          border-radius: 1.5rem;
          padding: 4rem 2rem;
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
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
          line-height: 1.3;
        }
        .hero-subtitle {
          font-size: 1.15rem;
          color: #c7d2fe;
          max-width: 600px;
          margin: 0 auto 2.5rem auto;
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
          margin-top: 1.25rem;
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
        
        .trust-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          background: white;
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .trust-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.75rem;
        }
        .trust-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .trust-title {
          font-weight: 800;
          color: #0f172a;
          font-size: 1rem;
          margin: 0;
        }
        .trust-desc {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }
        
        @media (max-width: 768px) {
          .trust-bar {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .hero-title {
            font-size: 2rem;
          }
        }
      `}} />
      
      {/* 1. Hero Banner */}
      <div className="hero-banner">
        <h1 className="hero-title">دليلك الذكي لأقوى العروض وتوفير فلوسك في مصر</h1>
        <p className="hero-subtitle">بنفحص الأسعار ونرشح لك أفضل صفقات أمازون مصر مع الشحن الرسمي وضمان الدفع عند الاستلام.</p>
        
        <div className="search-container">
          <form className="search-form" onSubmit={handleSearch}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="ابحث عن منتج، ماركة، أو فئة..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              dir="rtl"
            />
            <button type="submit" className="search-btn">
              <Search size={18} />
              بحث
            </button>
          </form>
          
          <div className="quick-searches">
            {quickSearches.map(term => (
              <button 
                key={term} 
                type="button" 
                className="quick-chip"
                onClick={() => router.push(`/?q=${encodeURIComponent(term)}`)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Trust Bar */}
      <div className="trust-bar">
        <div className="trust-item">
          <div className="trust-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 className="trust-title">مراجعات وتحليل ذكي</h3>
            <p className="trust-desc">نكشف لك المميزات والعيوب بحيادية لمساعدتك على الاختيار.</p>
          </div>
        </div>
        
        <div className="trust-item">
          <div className="trust-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <Truck size={26} />
          </div>
          <div>
            <h3 className="trust-title">تنفيذ وشحن أمازون الرسمي</h3>
            <p className="trust-desc">طلبك يصلك مباشرة عبر أسطول أمازون مصر الموثوق.</p>
          </div>
        </div>

        <div className="trust-item">
          <div className="trust-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Banknote size={26} />
          </div>
          <div>
            <h3 className="trust-title">دفع عند الاستلام وإرجاع سهل</h3>
            <p className="trust-desc">نفس سياسة الضمان والإرجاع المعتمدة رسمياً من أمازون.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
