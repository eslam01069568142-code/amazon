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
        className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        <span>🗂️</span>
        تصفح الفئات
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute right-0 top-full mt-2 z-50 w-[600px] max-w-[90vw] bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden flex animate-fade-in text-slate-800"
            onMouseLeave={() => setIsOpen(false)}
          >
          {/* Right Column: Parents (40%) */}
          <div className="w-2/5 bg-gray-50/50 border-l border-gray-100 flex flex-col">
            {parents.map((p, i) => (
              <button
                key={i}
                type="button"
                className={`py-3 px-4 text-sm font-medium flex justify-between items-center cursor-pointer transition-colors ${activeParent === p.category ? 'bg-white text-blue-600 shadow-sm border-r-2 border-r-blue-600' : 'text-slate-700 hover:bg-white hover:text-blue-600'}`}
                onMouseEnter={() => setActiveParent(p.category)}
              >
                <div className="flex items-center gap-2">
                  {p.icon && <span>{p.icon}</span>}
                  <span>{p.title}</span>
                </div>
                <ChevronLeft size={16} className={activeParent === p.category ? 'text-blue-600' : 'text-gray-300'} />
              </button>
            ))}
          </div>

          {/* Left Column: Children (60%) */}
          <div className="w-3/5 bg-white p-4 flex flex-col h-full">
            {activeParent && (() => {
              const children = getChildren(activeParent);
              const parentInfo = parents.find(p => p.category === activeParent);
              
              return (
                <div className="flex flex-col h-full">
                  <h3 className="font-extrabold text-slate-800 mb-3 border-b border-gray-100 pb-2 text-right">
                    {parentInfo?.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 flex-grow content-start">
                    {children.map((child, idx) => (
                      <Link
                        key={idx}
                        href={`/category/${generateSlug(child.title)}`}
                        className="px-3 py-2 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg font-semibold transition-colors text-right block truncate"
                        onClick={() => setIsOpen(false)}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                  
                  <Link
                    href={`/category/${generateSlug(parentInfo?.title || '')}`}
                    className="mt-4 px-4 py-2.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-colors text-center flex items-center justify-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    عرض كل المنتجات في هذا القسم &larr;
                  </Link>
                </div>
              );
            })()}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
