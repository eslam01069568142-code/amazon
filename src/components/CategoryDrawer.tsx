'use client';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, List, X, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Header.module.css';
import { generateSlug } from '@/utils/slugs';

export default function CategoryDrawer({ sections = [] }: { sections?: any[] }) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || '';
  const pathname = usePathname();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sections.length > 0) {
      setActiveParentId(sections[0].id);
    }
  }, [sections]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const activeParent = sections.find(s => s.id === activeParentId) || sections[0];

  return (
    <>
      <button 
        className={`${styles.categoryPill} ${drawerOpen ? styles.activePill : ''}`}
        onClick={() => setDrawerOpen(true)}
      >
        <List size={20} />
        <span>تصفح الفئات</span>
      </button>

      <Link href="/" className={`${styles.categoryPill} ${pathname === '/' && currentCategory === '' ? styles.activePill : ''}`}>
        الرئيسية
      </Link>
      
      <Link href={`/category/${generateSlug('ماي واي')}`} className={`${styles.categoryPill} ${pathname === `/category/${encodeURIComponent(generateSlug('ماي واي'))}` || pathname === `/category/${generateSlug('ماي واي')}` ? styles.activePill : ''}`}>
        منتجات ماي واي
      </Link>
      
      {mounted && createPortal(
        <>
          {/* Dark Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/60 z-[99998] transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setDrawerOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div 
            className={`fixed inset-y-0 right-0 h-full w-full max-w-[680px] bg-white shadow-2xl z-[99999] flex flex-col transform transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <List size={24} className="text-indigo-900" />
                تصفح جميع الفئات
              </h2>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Right Column (Main Categories) */}
              <div className="w-[270px] sm:w-[290px] shrink-0 bg-gray-50 border-l border-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                {sections.map((parent: any) => (
                  <div
                    key={parent.id}
                    onMouseEnter={() => setActiveParentId(parent.id)}
                    onClick={() => setActiveParentId(parent.id)}
                    className={`border-r-4 px-5 py-3.5 flex items-center justify-between cursor-pointer transition-all ${
                      activeParentId === parent.id 
                        ? 'border-black bg-white font-bold text-black shadow-sm' 
                        : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <span className="whitespace-nowrap text-sm sm:text-base">{parent.title}</span>
                    <ChevronLeft size={16} className={activeParentId === parent.id ? 'text-black' : 'text-gray-400'} />
                  </div>
                ))}
              </div>

              {/* Left Column (Subcategories) */}
              <div className="flex-1 bg-white p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  {activeParent?.title}
                </h3>
                
                <div className="flex flex-col gap-2 flex-1">
                  {activeParent?.children && activeParent.children.length > 0 ? (
                    activeParent.children.map((child: any) => (
                      <Link
                        key={child.id}
                        href={`/category/${generateSlug(child.title)}`}
                        onClick={() => setDrawerOpen(false)}
                        className="text-gray-600 hover:text-black hover:bg-gray-50 px-3 py-2.5 rounded-md transition-colors text-sm sm:text-base"
                      >
                        {child.title}
                      </Link>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm py-4">لا توجد فئات فرعية</div>
                  )}
                </div>

                {/* View All Button */}
                {activeParent && (
                  <Link
                    href={`/category/${generateSlug(activeParent.title)}`}
                    onClick={() => setDrawerOpen(false)}
                    className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-gray-50 hover:bg-gray-100 text-black font-semibold rounded-lg border border-gray-200 transition-colors"
                  >
                    عرض كل منتجات هذا القسم
                    <ArrowLeft size={16} />
                  </Link>
                )}
              </div>

            </div>
          </div>
        </>
      , document.body)}
    </>
  );
}
