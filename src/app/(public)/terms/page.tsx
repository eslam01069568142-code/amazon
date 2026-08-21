import React from 'react';

export const metadata = {
  title: 'شروط الاستخدام - Bkam El-Naharda',
};

export default function TermsPage() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--surface-color)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h1 className="text-3xl" style={{ marginBottom: '1.5rem', fontWeight: 800 }}>شروط الاستخدام</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>1. قبول الشروط</h2>
            <p>باستخدامك لموقع Bkam El-Naharda، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام موقعنا.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>2. طبيعة الخدمة</h2>
            <p>موقعنا هو منصة تابعة تقوم بعرض المنتجات والعروض من موقع أمازون مصر. نحن لا نبيع المنتجات مباشرة ولا نتحمل مسؤولية الشحن أو الاسترجاع. جميع عمليات الشراء تتم على موقع أمازون وتخضع لشروطهم.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>3. دقة المعلومات</h2>
            <p>نسعى جاهدين لتوفير معلومات دقيقة ومحدثة حول الأسعار والمنتجات. ومع ذلك، قد تتغير الأسعار وتوافر المنتجات على أمازون دون إشعار مسبق. السعر النهائي والفعلي هو السعر المعروض على موقع أمازون وقت الشراء.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>4. إخلاء المسؤولية</h2>
            <p>لا يتحمل موقع Bkam El-Naharda أي مسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام الموقع أو الاعتماد على المعلومات المقدمة فيه.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
