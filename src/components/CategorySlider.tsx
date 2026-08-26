'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, List, ChevronLeft } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Header.module.css';

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
      const dropdownWidth = 700; // max expected width of the dropdown on desktop
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

      <Link href="/" className={`${styles.categoryPill} ${currentCategory === '' ? styles.activePill : ''}`}>
        الرئيسية
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
            {/* Sidebar: Parent Categories */}
            <div className={styles.megaMenuSidebar}>
              {sections.map((parent) => (
                <div
                  key={parent.id}
                  className={`${styles.megaMenuParent} ${activeParentId === parent.id ? styles.active : ''}`}
                  onMouseEnter={() => window.innerWidth > 768 && setActiveParentId(parent.id)}
                  onClick={() => window.innerWidth <= 768 && setActiveParentId(parent.id)}
                >
                  <Link href={`/?category=${parent.category}`} onClick={() => setDropdownOpen(false)} style={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}>
                    {parent.title}
                  </Link>
                  <ChevronLeft size={16} style={{ color: activeParentId === parent.id ? 'var(--accent-color)' : '#94a3b8' }} />
                </div>
              ))}
            </div>

            {/* Content: Subcategories */}
            <div className={styles.megaMenuContent}>
              {activeParent?.children && activeParent.children.length > 0 ? (
                activeParent.children.map((child: any) => (
                  <Link
                    key={child.id}
                    href={`/?category=${child.category}`}
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
