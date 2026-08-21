import React from 'react';

export const metadata = {
  title: 'تواصل معنا - Bkam El-Naharda',
};

export default function ContactPage() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--surface-color)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h1 className="text-3xl" style={{ marginBottom: '1.5rem', fontWeight: 800 }}>تواصل معنا</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          
          <p>
            يسعدنا دائماً تواصلكم معنا. إذا كان لديكم أي استفسار أو اقتراح، يمكنكم الوصول إلينا عبر القنوات التالية:
          </p>

          <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.25rem' }}>معلومات الاتصال</h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><strong>البريد الإلكتروني:</strong> contact@bkam.com</li>
              <li>يمكنكم أيضاً التواصل معنا عبر حساباتنا على وسائل التواصل الاجتماعي المذكورة في أسفل الصفحة.</li>
            </ul>
          </div>

          <p style={{ fontSize: '0.875rem' }}>
            ملاحظة: بخصوص طلبات الاسترجاع أو مشاكل الشحن، يرجى التواصل مباشرة مع خدمة عملاء موقع أمازون، حيث أن جميع عمليات الشراء تتم من خلالهم.
          </p>

        </div>
      </div>
    </div>
  );
}
