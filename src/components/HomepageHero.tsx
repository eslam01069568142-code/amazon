'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ShieldCheck, Truck, Banknote, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const announcements = [
  '🛡️ مراجعات وتحليل ذكي: نكشف لك المميزات والعيوب بحيادية لمساعدتك على الاختيار.',
  '🚚 تنفيذ وشحن أمازون الرسمي: طلبك يصلك مباشرة عبر أسطول أمازون مصر الموثوق.',
  '💵 دفع عند الاستلام وإرجاع سهل: نفس سياسة الضمان والإرجاع المعتمدة رسمياً من أمازون.'
];

export default function HomepageHero() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{id: string, title: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLFormElement>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const abortController = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`, { signal: abortController.signal })
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
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
        <p className="hero-subtitle text-blue-100">بنفحص الأسعار ونرشح لك أفضل صفقات أمازون مصر مع الشحن الرسمي وضمان الدفع عند الاستلام.</p>
        
        <div className="search-container">
          <form className="search-form" onSubmit={handleSearch} ref={dropdownRef}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="ابحث عن منتج، ماركة، أو فئة..." 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              dir="rtl"
            />
            {query && (
              <button 
                type="button" 
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            )}
            <button type="submit" className="search-btn">
              <Search size={18} />
              بحث
            </button>
          </form>

          {showDropdown && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem',
              backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden'
            }}>
              {suggestions.map(s => (
                <div 
                  key={s.id}
                  onClick={() => {
                    setShowDropdown(false);
                    router.push(`/product/${s.id}`);
                  }}
                  style={{ padding: '0.85rem 1.25rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#1e293b', textAlign: 'right', fontSize: '0.95rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  {s.title}
                </div>
              ))}
            </div>
          )}
          
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

          {/* Embedded Ticker */}
          <div className="mt-4 max-w-xl mx-auto flex justify-center items-center py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white text-xs sm:text-sm text-center overflow-hidden">
            <p 
              key={tickerIndex}
              className="transition-opacity duration-500 ease-in-out font-medium truncate"
            >
              {announcements[tickerIndex]}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
