import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bkam El-Naharda Admin',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', direction: 'rtl', padding: '2rem' }}>
      <div className="container" style={{ maxWidth: '800px', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        {children}
      </div>
    </div>
  );
}
