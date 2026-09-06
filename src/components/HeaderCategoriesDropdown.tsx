'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, X } from 'lucide-react';
import { generateSlug } from '@/utils/slugs';

export default function HeaderCategoriesDropdown({ categories }: { categories: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeParent, setActiveParent] = useState<string | null>(null);

  const parents = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  useEffect(() => {
    if (parents.length > 0 && !activeParent) {
      setActiveParent(parents[0].category);
    }
  }, [parents, activeParent]);

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
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-[600px] bg-white shadow-2xl flex flex-col z-[101] animate-slide-in-right text-slate-800">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-extrabold text-slate-900">تصفح جميع الفئات</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
                aria-label="إغلاق"
              >
                <X size={24} />
              </button>
            </div>

            {/* Drawer Body (2 Columns) */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Right Column: Parents (40%) */}
              <div className="w-2/5 bg-gray-50/50 border-l border-gray-100 overflow-y-auto flex flex-col custom-scrollbar">
                {parents.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`py-4 px-4 text-sm font-medium flex justify-between items-center cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${activeParent === p.category ? 'bg-white text-blue-600 shadow-sm border-r-4 border-r-blue-600' : 'text-slate-700 hover:bg-white hover:text-blue-600'}`}
                    onMouseEnter={() => setActiveParent(p.category)}
                    onClick={() => setActiveParent(p.category)}
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
              <div className="w-3/5 bg-white p-5 overflow-y-auto flex flex-col custom-scrollbar">
                {activeParent && (() => {
                  const children = getChildren(activeParent);
                  const parentInfo = parents.find(p => p.category === activeParent);
                  
                  return (
                    <div className="flex flex-col h-full">
                      <h3 className="font-extrabold text-lg text-slate-800 mb-4 border-b border-gray-100 pb-3 text-right">
                        {parentInfo?.title}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-grow content-start">
                        {children.map((child, idx) => (
                          <Link
                            key={idx}
                            href={`/category/${generateSlug(child.title)}`}
                            className="px-3 py-2.5 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg font-semibold transition-colors text-right block truncate border border-transparent hover:border-blue-100"
                            onClick={() => setIsOpen(false)}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                      
                      <Link
                        href={`/category/${generateSlug(parentInfo?.title || '')}`}
                        className="mt-6 px-4 py-3 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-colors text-center flex items-center justify-center gap-2 shadow-sm"
                        onClick={() => setIsOpen(false)}
                      >
                        عرض كل المنتجات في هذا القسم &larr;
                      </Link>
                    </div>
                  );
                })()}
              </div>
              
            </div>
          </div>
        </div>
      )}
    </>
  );
}
