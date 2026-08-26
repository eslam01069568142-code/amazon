'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, Home, Smartphone, User, Tag, ChevronDown, List } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Header.module.css';

export default function CategorySlider({ sections = [] }: { sections?: any[] }) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || '';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const dropdownWidth = 240; // max expected width of the dropdown
      const margin = 10; // Safe margin from screen edges

      // Distance from the right edge of the viewport to the right edge of the button
      let calculatedRight = viewportWidth - rect.right;

      // Ensure the dropdown doesn't overflow the left edge of the screen
      if (calculatedRight + dropdownWidth > viewportWidth - margin) {
        calculatedRight = viewportWidth - dropdownWidth - margin;
      }

      // Ensure the dropdown doesn't overflow the right edge of the screen
      if (calculatedRight < margin) {
        calculatedRight = margin;
      }

      setCoords({
        top: rect.bottom + window.scrollY + 8,
        right: calculatedRight
      });
    }
    setDropdownOpen(!dropdownOpen);
  };

  const renderIcon = (catId: string) => {
    switch (catId) {
      case 'Electronics': return <Smartphone size={18} />;
      case 'Mens': return <User size={18} />;
      default: return <Tag size={18} />;
    }
  };

  return (
    <nav className={styles.sliderNav}>
      <div className={styles.sliderContainer}>
        
        {/* 1. Categories Dropdown */}
        <div className={styles.categoryDropdownWrapper}>
          <button 
            ref={buttonRef}
            className={`${styles.categoryPill} ${currentCategory && currentCategory !== '' ? styles.activePill : ''}`}
            onClick={handleToggle}
          >
            <List size={20} />
            <span>الفئات</span>
            <ChevronDown size={16} style={{ marginLeft: '-4px', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {mounted && dropdownOpen && createPortal(
            <>
              {/* Invisible overlay to catch clicks outside the dropdown */}
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); }}
              />
              <div 
                className={styles.dropdownMenu}
                style={{ position: 'absolute', top: coords.top, right: coords.right, marginTop: 0, zIndex: 1000 }}
              >
                {sections.map((sec) => (
                  <Link 
                    key={sec.id} 
                    href={`/?category=${sec.category}`}
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    {renderIcon(sec.category)}
                    <span>{sec.title}</span>
                  </Link>
                ))}
              </div>
            </>,
            document.body
          )}
        </div>

        {/* 2. Home */}
        <Link 
          href="/"
          className={`${styles.categoryPill} ${currentCategory === '' ? styles.activePill : ''}`}
        >
          <Home size={20} />
          <span>الرئيسية</span>
        </Link>

        {/* 3. All Products (Currently mapping to Home as well, since Home displays all sections, but conceptually it could be a different view. We map it to Home without category params) */}
        <Link 
          href="/"
          className={`${styles.categoryPill}`}
        >
          <LayoutGrid size={20} />
          <span>كل المنتجات</span>
        </Link>
        
      </div>
    </nav>
  );
}
