import React from 'react';

export const metadata = {
  title: 'من نحن - Bkam El-Naharda',
};

export default function AboutPage() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--surface-color)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h1 className="text-3xl" style={{ marginBottom: '1.5rem', fontWeight: 800 }}>من نحن</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <p>
            أهلاً بك في <strong>Bkam El-Naharda</strong>، منصتك الأولى لاكتشاف أفضل العروض والخصومات والمنتجات المميزة.
          </p>
          <p>
            نحن نهدف إلى توفير تجربة تسوق سهلة ومريحة من خلال تجميع أفضل المنتجات من أمازون مصر وعرضها بطريقة منظمة ومبسطة، مع تقديم مراجعات دقيقة لمساعدتك في اتخاذ قرار الشراء الأفضل.
          </p>
          <p>
            فريقنا يعمل باستمرار على تحديث العروض والأسعار لضمان حصولك على القيمة الأفضل دائماً.
          </p>
        </div>
      </div>
    </div>
  );
}
