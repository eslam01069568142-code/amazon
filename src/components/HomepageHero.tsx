'use client';

import React, { useState } from 'react';
import { Search, ShieldCheck, Truck, Banknote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import HeaderCategoriesDropdown from './HeaderCategoriesDropdown';

export default function HomepageHero({ categories = [] }: { categories?: any[] }) {
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
          font-weight: 800;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
          line-height: 1.3;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .hero-subtitle {
          font-size: 1.15rem;
          color: #dbeafe; /* blue-100 */
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
        .search-actions {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 1rem;
          margin-top: 1.25rem;
          width: 100%;
          direction: rtl;
          text-align: right;
        }
        .quick-searches {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
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
        
        .unified-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-direction: row-reverse; /* Logo on far left in RTL */
          background: linear-gradient(135deg, #0d6efd, #0056b3);
          padding: 0.5rem 1rem;
          border-radius: 999px;
          margin-bottom: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .unified-right {
          display: flex;
          align-items: center;
        }
        .unified-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .trust-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        @media (max-width: 1024px) {
          .unified-bar {
            flex-direction: column;
            border-radius: 1rem;
            padding: 1rem;
            gap: 1rem;
          }
          .unified-left {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 1.75rem;
          }
        }
      `}} />
      
      {/* 0. Unified Top Bar */}
      <div className="unified-bar">
        <div className="unified-right">
          <Link href="/">
            <Image src="/logo.png" alt="Bkam El-Naharda Logo" width={60} height={60} style={{ objectFit: 'contain' }} priority />
          </Link>
        </div>
        <div className="unified-left">
          <div className="trust-pill">
            <ShieldCheck size={16} className="text-blue-200" />
            <span>مراجعات محايدة</span>
          </div>
          <div className="trust-pill">
            <Truck size={16} className="text-blue-200" />
            <span>شحن أمازون الرسمي</span>
          </div>
          <div className="trust-pill">
            <Banknote size={16} className="text-blue-200" />
            <span>دفع عند الاستلام</span>
          </div>
        </div>
      </div>
      
      {/* 1. Hero Banner */}
      <div className="hero-banner">
        <h1 className="hero-title text-white font-extrabold drop-shadow-sm">
          دليلك الذكي لأقوى العروض و<span className="text-amber-300">توفير فلوسك</span> في مصر
        </h1>
        <p className="hero-subtitle text-blue-100">بنفحص الأسعار ونرشح لك أفضل صفقات أمازون مصر مع الشحن الرسمي وضمان الدفع عند الاستلام.</p>
        
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
          
          <div className="w-full max-w-5xl mx-auto flex justify-start items-center gap-3 mt-4 px-4 dir-rtl text-right flex-wrap">
            <div className="flex-shrink-0 relative z-50">
              <HeaderCategoriesDropdown categories={categories} />
            </div>
            <div className="flex flex-wrap gap-2">
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
      </div>

    </div>
  );
}
