import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck, Truck, Banknote } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      {/* Dedicated Trust Bar directly beneath the top header */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 shadow-sm dir-rtl">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-600 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">مراجعات وتحليل ذكي</h4>
                <p className="text-xs text-gray-500">نكشف لك المميزات والعيوب بحيادية لمساعدتك على الاختيار.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">تنفيذ وشحن رسمي موثوق</h4>
                <p className="text-xs text-gray-500">طلبك يصلك مباشرة عبر أسطول المتاجر المعتمدة.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Banknote className="text-green-600 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">دفع عند الاستلام وإرجاع سهل</h4>
                <p className="text-xs text-gray-500">نفس سياسة الضمان والإرجاع المعتمدة رسمياً.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
