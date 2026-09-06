'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, X } from 'lucide-react';
import { generateSlug } from '@/utils/slugs';

export default function HeaderCategoriesDropdown({ categories }: { categories: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  // Use only parent categories for the single column list
  const parents = categories.filter(c => !c.parent_id);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const closeDrawer = () => setIsOpen(false);

  return (
    <>
      <button 
        type="button"
        className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-colors whitespace-nowrap"
        onClick={() => setIsOpen(true)}
      >
        <span>🗂️</span>
        تصفح الفئات
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end dir-rtl">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-[9998] transition-opacity animate-fade-in"
            onClick={closeDrawer}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-[480px] sm:max-w-[580px] bg-white shadow-2xl flex flex-col h-full z-[9999] animate-slide-in-right overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
              <h3 className="font-bold text-lg text-slate-800">تصفح جميع الفئات</h3>
              <button 
                onClick={closeDrawer}
                className="p-2 text-gray-500 hover:text-black rounded-full hover:bg-gray-100 transition-colors"
                aria-label="إغلاق"
              >
                <X size={24} />
              </button>
            </div>

            {/* Drawer Body (Vertical List) */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white custom-scrollbar">
              {parents.map((cat, i) => (
                <Link 
                  key={cat.id || i} 
                  href={`/category/${generateSlug(cat.title)}`}
                  onClick={closeDrawer}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-slate-800 hover:bg-blue-50 hover:text-blue-600 transition-colors text-right group"
                >
                  <div className="flex items-center gap-3">
                    {cat.icon && <span className="text-xl">{cat.icon}</span>}
                    <span className="font-medium text-base">{cat.title}</span>
                  </div>
                  <span className="text-gray-400 font-bold text-lg group-hover:text-blue-600 transition-colors">‹</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
