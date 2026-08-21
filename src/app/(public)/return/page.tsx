import React from 'react';

export const metadata = {
  title: 'سياسة الاسترجاع - Bkam El-Naharda',
};

export default function ReturnPage() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--surface-color)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h1 className="text-3xl" style={{ marginBottom: '1.5rem', fontWeight: 800 }}>سياسة الاسترجاع</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>1. عمليات الاسترجاع</h2>
            <p>جميع عمليات الاسترجاع واسترداد الأموال تتم حصرياً عبر منصة أمازون مصر وحسب سياسات الاسترجاع الخاصة بهم. موقعنا لا يتولى أو يتدخل في هذه العمليات.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>2. شروط الاسترجاع لدى أمازون</h2>
            <p>تخضع المنتجات لسياسة الاسترجاع المحددة لكل منتج على صفحة أمازون. نوصي دائماً بقراءة شروط الاسترجاع الخاصة بالبائع قبل إتمام عملية الشراء.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>3. طلب استرجاع</h2>
            <p>لتقديم طلب استرجاع منتج قمت بشرائه، يرجى تسجيل الدخول إلى حسابك على موقع أمازون، والذهاب إلى "طلباتي" (Your Orders)، واتباع خطوات الاسترجاع الموضحة هناك.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
