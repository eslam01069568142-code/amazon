import Link from 'next/link';
import styles from './Header.module.css';
import SearchBar from './SearchBar';
import Image from 'next/image';

export default function Header() {
  return (
    <header className={styles.header}>
      {/* Top Bar: Logo + Search */}
      <div className={styles.topBarWrapper}>
        <div className={`container ${styles.topBarInner}`}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.png" alt="Bkam El-Naharda Logo" width={80} height={80} style={{ objectFit: 'contain' }} priority />
          </Link>
          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>
        </div>
      </div>
    </header>
  );
}
