'use client';
import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Header.module.css';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{id: string, title: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLFormElement>(null);

  if (pathname === '/') {
    return null;
  }

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const abortController = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`, { signal: abortController.signal })
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.searchContainer} ref={dropdownRef}>
      <input 
        type="text" 
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="ابحث عن منتج، ماركة، أو فئة..." 
        className={styles.searchInput}
      />
      <Search className={styles.searchIcon} size={24} />
      <button type="submit" className={styles.searchButton}>بحث</button>

      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem',
          backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden'
        }}>
          {suggestions.map(s => (
            <div 
              key={s.id}
              onClick={() => {
                setShowDropdown(false);
                router.push(`/product/${s.id}`);
              }}
              style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#1e293b', textAlign: 'right' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              {s.title}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
