import React from 'react';

export const metadata = {
  title: 'سياسة الشحن - Bkam El-Naharda',
};

export default function ShippingPage() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--surface-color)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h1 className="text-3xl" style={{ marginBottom: '1.5rem', fontWeight: 800 }}>سياسة الشحن</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>1. عمليات الشحن والتوصيل</h2>
            <p>جميع عمليات الشحن والتوصيل تتم مباشرة من خلال موقع أمازون مصر. نحن لا نقوم بتخزين أو شحن أو توصيل أي منتجات بأنفسنا.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>2. رسوم ومدة الشحن</h2>
            <p>تختلف رسوم ومدة الشحن حسب سياسات أمازون، ونوع المنتج، والمنطقة الجغرافية. يمكنك الاطلاع على تكلفة الشحن النهائية ووقت التوصيل المتوقع أثناء إتمام عملية الشراء على موقع أمازون.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>3. تتبع الشحنات</h2>
            <p>بعد إتمام عملية الشراء، يمكنك تتبع شحنتك ومتابعة حالتها مباشرة من خلال حسابك الخاص على موقع أمازون.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
