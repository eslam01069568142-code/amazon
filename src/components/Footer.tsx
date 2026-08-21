import Link from 'next/link';
import { getDb } from '@/data/db';

export default async function Footer() {
  const db = await getDb();
  const socialLinks = db.settings.socialLinks || [];
  const facebook = socialLinks.find(l => l.platform === 'facebook')?.url;
  const instagram = socialLinks.find(l => l.platform === 'instagram')?.url;
  const twitter = socialLinks.find(l => l.platform === 'x' || l.platform === 'twitter')?.url;
  const tiktok = socialLinks.find(l => l.platform === 'tiktok')?.url;

  return (
    <footer style={{ backgroundColor: 'var(--text-primary)', color: 'white', padding: '2rem 0', marginTop: 'auto' }}>
      <div className="container" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'white' }}>Bkam El-Naharda</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.875rem' }}>
            موقعك الأول لمقارنة الأسعار واكتشاف أفضل العروض والخصومات من أمازون مصر.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'white' }}>روابط هامة</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <li><Link href="/about" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}>من نحن</Link></li>
            <li><Link href="/privacy" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}>سياسة الخصوصية</Link></li>
            <li><Link href="/terms" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}>شروط الاستخدام</Link></li>
            <li><Link href="/shipping" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}>سياسة الشحن</Link></li>
            <li><Link href="/return" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}>سياسة الاسترجاع</Link></li>
            <li><Link href="/contact" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}>اتصل بنا</Link></li>
          </ul>
        </div>

        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'white' }}>تابعنا</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
            )}
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0-2.881 0 1.44 1.44 0 0 0 2.881 0z"/>
                </svg>
              </a>
            )}
            {twitter && (
              <a href={twitter} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} aria-label="Twitter/X">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                </svg>
              </a>
            )}
            {tiktok && (
              <a href={tiktok} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} aria-label="TikTok">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            )}
            {!facebook && !instagram && !twitter && !tiktok && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>لا توجد حسابات حالياً</span>
            )}
          </div>
        </div>

      </div>
      <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #334155', color: 'var(--text-secondary)', paddingBottom: '1rem' }}>
        <div className="container">
          <p style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '800px', margin: '0 auto 0.75rem', lineHeight: '1.6' }}>
            إخلاء مسؤولية: بصفتنا شريكاً في برنامج شركاء أمازون (Amazon Associates)، فإننا نربح عمولة من عمليات الشراء المؤهلة التي تتم عبر الروابط الموجودة في هذا الموقع، وذلك دون أي تكلفة إضافية على المشتري.
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} Bkam El-Naharda
          </p>
        </div>
      </div>
    </footer>
  );
}
