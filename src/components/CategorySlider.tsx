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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const rightDistance = document.documentElement.clientWidth - rect.right;
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        right: rightDistance
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
        
        {/* 1. Home */}
        <Link 
          href="/"
          className={`${styles.categoryPill} ${currentCategory === '' ? styles.activePill : ''}`}
        >
          <Home size={20} />
          <span>الرئيسية</span>
        </Link>
        
        {/* 2. Categories Dropdown */}
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
            <div 
              className={styles.dropdownMenu}
              ref={dropdownRef}
              style={{ position: 'absolute', top: coords.top, right: coords.right, marginTop: 0 }}
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
            </div>,
            document.body
          )}
        </div>

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
