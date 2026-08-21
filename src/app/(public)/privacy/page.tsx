import React from 'react';

export const metadata = {
  title: 'سياسة الخصوصية - Bkam El-Naharda',
};

export default function PrivacyPage() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--surface-color)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h1 className="text-3xl" style={{ marginBottom: '1.5rem', fontWeight: 800 }}>سياسة الخصوصية</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>1. جمع المعلومات</h2>
            <p>نقوم بجمع المعلومات التي تقدمها لنا طواعية عند استخدام الموقع، وكذلك بعض المعلومات التي يتم جمعها تلقائياً عبر تقنيات مثل ملفات تعريف الارتباط (Cookies) لتحسين تجربة المستخدم.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>2. استخدام المعلومات</h2>
            <p>نستخدم المعلومات التي نجمعها لتحسين موقعنا، تخصيص تجربتك، والتواصل معك بشأن العروض والتحديثات الجديدة. لا نقوم ببيع معلوماتك الشخصية لأي طرف ثالث.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>3. برامج الشراكة والروابط الخارجية</h2>
            <p>يحتوي موقعنا على روابط خارجية لموقع أمازون (Amazon). نحن نشارك في برنامج شركاء أمازون. عند النقر على هذه الروابط وإجراء عملية شراء، قد نحصل على عمولة. تخضع عمليات الشراء لسياسات الخصوصية الخاصة بأمازون.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>4. حماية البيانات</h2>
            <p>نتخذ تدابير أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
