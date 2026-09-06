'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { generateSlug } from '@/utils/slugs';

export default function HeaderCategoriesDropdown({ categories }: { categories: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeParent, setActiveParent] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const parents = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  useEffect(() => {
    if (parents.length > 0 && !activeParent) {
      setActiveParent(parents[0].category);
    }
  }, [parents, activeParent]);

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
        type="button"
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full font-bold transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        <span>🗂️</span>
        تصفح الفئات
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-[600px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[100] flex animate-fade-in"
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Right Column: Parents */}
          <div className="w-1/3 bg-slate-50 border-l border-slate-100 flex flex-col p-2">
            {parents.map((p, i) => (
              <button
                key={i}
                type="button"
                className={`flex items-center justify-between text-right px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${activeParent === p.category ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                onMouseEnter={() => setActiveParent(p.category)}
              >
                <div className="flex items-center gap-2">
                  {p.icon && <span>{p.icon}</span>}
                  <span>{p.title}</span>
                </div>
                <ChevronLeft size={14} className={activeParent === p.category ? 'text-blue-500' : 'text-slate-300'} />
              </button>
            ))}
          </div>

          {/* Left Column: Children */}
          <div className="w-2/3 bg-white p-4">
            {activeParent && (() => {
              const children = getChildren(activeParent);
              const parentInfo = parents.find(p => p.category === activeParent);
              
              return (
                <div>
                  <h3 className="font-extrabold text-slate-800 mb-3 border-b border-slate-100 pb-2">
                    {parentInfo?.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/category/${generateSlug(parentInfo?.title || '')}`}
                      className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-bold transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      عرض الكل &larr;
                    </Link>
                    {children.map((child, idx) => (
                      <Link
                        key={idx}
                        href={`/category/${generateSlug(child.title)}`}
                        className="px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg font-semibold transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
