import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeaderWrapper from '@/components/HeaderWrapper';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
