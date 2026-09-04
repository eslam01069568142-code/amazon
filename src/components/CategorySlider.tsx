'use client';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, List, ChevronLeft } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Header.module.css';
import { generateSlug } from '@/utils/slugs';

export default function CategorySlider({ sections = [] }: { sections?: any[] }) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || '';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  useEffect(() => {
    setMounted(true);
    if (sections.length > 0) {
      setActiveParentId(sections[0].id);
    }
  }, [sections]);

  const handleToggle = () => {
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const dropdownWidth = 430; // max expected width of the dropdown on desktop
      const margin = 10;

      let calculatedRight = viewportWidth - rect.right;
      if (calculatedRight + dropdownWidth > viewportWidth - margin) {
        calculatedRight = Math.max(margin, viewportWidth - dropdownWidth - margin);
      }

      setCoords({
        top: rect.bottom + window.scrollY + 8,
        right: calculatedRight
      });
    }
    setDropdownOpen(!dropdownOpen);
  };

  const activeParent = sections.find(s => s.id === activeParentId) || sections[0];
  const pathname = usePathname();

  return (
    <>
      <button 
        ref={buttonRef}
        className={`${styles.categoryPill} ${dropdownOpen ? styles.activePill : ''}`}
        onClick={handleToggle}
      >
        <List size={20} />
        <span>تصفح الفئات</span>
        <ChevronDown size={16} style={{ marginLeft: '-4px', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <Link href="/" className={`${styles.categoryPill} ${pathname === '/' && currentCategory === '' ? styles.activePill : ''}`}>
        الرئيسية
      </Link>
      
      <Link href="/my-way" className={`${styles.categoryPill} ${pathname === '/my-way' ? styles.activePill : ''}`}>
        منتجات ماي واي
      </Link>
      
      {mounted && dropdownOpen && createPortal(
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); }}
          />
          <div 
            className={styles.dropdownMenu}
            style={{ 
              position: 'absolute', 
              top: coords.top, 
              right: window.innerWidth > 768 ? coords.right : '1rem', 
              left: window.innerWidth > 768 ? 'auto' : '1rem',
              zIndex: 1000 
            }}
          >
            {/* Desktop: Parent Sidebar / Mobile: Accordion */}
            <div className={styles.megaMenuSidebar}>
              {sections.map((parent: any) => (
                <div key={parent.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    className={`${styles.megaMenuParent} ${activeParentId === parent.id ? styles.active : ''}`}
                    onMouseEnter={() => window.innerWidth > 768 && setActiveParentId(parent.id)}
                    onClick={(e) => {
                      if (window.innerWidth <= 768) {
                        e.preventDefault();
                        setActiveParentId(activeParentId === parent.id ? null : parent.id);
                      }
                    }}
                    style={{ borderBottom: window.innerWidth <= 768 ? '1px solid #e2e8f0' : 'none', marginBottom: 0, paddingBottom: window.innerWidth <= 768 ? '0.75rem' : '0.5rem', paddingRight: '1rem', paddingLeft: '1rem' }}
                  >
                    <Link href={`/category/${generateSlug(parent.title)}`} onClick={() => window.innerWidth > 768 && setDropdownOpen(false)} style={{ color: 'inherit', textDecoration: 'none', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {parent.title}
                      {window.innerWidth <= 768 ? (
                         <ChevronDown size={16} style={{ color: '#94a3b8', transform: activeParentId === parent.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      ) : (
                         <ChevronLeft size={16} style={{ color: activeParentId === parent.id ? 'var(--accent-color)' : '#94a3b8' }} />
                      )}
                    </Link>
                  </div>
                  
                  {/* Mobile Children Accordion */}
                  {window.innerWidth <= 768 && activeParentId === parent.id && (
                    <div style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9' }}>
                      {parent.children && parent.children.length > 0 ? (
                        parent.children.map((child: any) => (
                          <Link
                            key={child.id}
                            href={`/category/${generateSlug(child.title)}`}
                            className={styles.megaMenuChild}
                            onClick={() => setDropdownOpen(false)}
                          >
                            {child.title}
                          </Link>
                        ))
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>لا توجد فئات فرعية</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Children Content */}
            <div className={styles.megaMenuContent}>
              {activeParent?.children && activeParent.children.length > 0 ? (
                activeParent.children.map((child: any) => (
                  <Link
                    key={child.id}
                    href={`/category/${generateSlug(child.title)}`}
                    className={styles.megaMenuChild}
                    onClick={() => setDropdownOpen(false)}
                  >
                    {child.title}
                  </Link>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', gridColumn: '1 / -1' }}>لا توجد فئات فرعية</div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
