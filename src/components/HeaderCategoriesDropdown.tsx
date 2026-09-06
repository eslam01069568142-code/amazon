'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown } from 'lucide-react';
import { generateSlug } from '@/utils/slugs';

export default function HeaderCategoriesDropdown({ categories }: { categories: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        <Menu size={20} />
        تصفح الفئات
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="py-2 flex flex-col">
            {categories.map((cat, i) => (
              <Link 
                key={i}
                href={`/category/${generateSlug(cat.title)}`}
                className="px-4 py-3 text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-semibold border-b border-slate-50 last:border-0 flex items-center gap-3 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
