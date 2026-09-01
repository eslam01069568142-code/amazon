'use client';

import React, { useState } from 'react';
import { Bell, TrendingDown, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface ProductPageInteractiveProps {
  productId: string;
  productTitle: string;
  currentPrice: number | null;
  displayPriceStr: string;
  description: string;
  offers: { storeName: string; price: number | null; url: string }[];
}

export default function ProductPageInteractive({
  productId,
  productTitle,
  currentPrice,
  displayPriceStr,
  description,
  offers
}: ProductPageInteractiveProps) {
  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>(currentPrice ? String(Math.round(currentPrice * 0.9)) : '');
  const [email, setEmail] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI Summary State
  const [summaryPoints, setSummaryPoints] = useState<string[]>(() => {
    const lines = (description || '').split('\n').map(l => l.trim()).filter(l => l.length > 5);
    return lines.slice(0, 4);
  });

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertLoading(true);
    setAlertMessage(null);

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          storeId: selectedStore || null,
          targetPrice,
          email
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          setShowAlertModal(false);
          setAlertMessage(null);
        }, 3000);
      } else {
        setAlertMessage({ type: 'error', text: data.error || 'فشل تسجيل التنبيه' });
      }
    } catch {
      setAlertMessage({ type: 'error', text: 'تعذر الاتصال بالخادم. حاول لاحقاً.' });
    } finally {
      setAlertLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Action Buttons: Price Alert & History */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowAlertModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            borderRadius: '0.5rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          <Bell size={16} />
          <span>🔔 تنبيه عند انخفاض السعر</span>
        </button>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            backgroundColor: '#f8fafc',
            color: '#475569',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <TrendingDown size={16} className="text-emerald-600" />
          <span>📉 تتبع تغير السعر: مستقر</span>
        </div>
      </div>

      {/* AI / Local Features Summary Box */}
      {summaryPoints.length > 0 && (
        <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#7e22ce', fontWeight: 800, fontSize: '0.95rem' }}>
            <Sparkles size={18} />
            <span>💡 ملخص مميزات المنتج</span>
          </div>
          <ul style={{ margin: 0, paddingRight: '1.25rem', listStyleType: 'disc', color: '#581c87', fontSize: '0.85rem', lineHeight: '1.6' }}>
            {summaryPoints.map((pt, idx) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Alert Modal */}
      {showAlertModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} dir="rtl">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', maxWidth: '420px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} className="text-blue-600" />
                <span>إنشاء تنبيه هبوط السعر</span>
              </h3>
              <button onClick={() => setShowAlertModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  السعر المستهدف (ج.م)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.9rem', outline: 'none' }}
                  value={targetPrice}
                  onChange={e => setTargetPrice(e.target.value)}
                  placeholder="مثال: 5000"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  البريد الإلكتروني للتنبيه
                </label>
                <input
                  type="email"
                  required
                  style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.9rem', outline: 'none' }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                />
              </div>

              {offers.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    المتجر المفضل (اختياري)
                  </label>
                  <select
                    style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.9rem', outline: 'none' }}
                    value={selectedStore}
                    onChange={e => setSelectedStore(e.target.value)}
                  >
                    <option value="">جميع المتاجر المتاحة</option>
                    {offers.map((o, idx) => (
                      <option key={idx} value={o.storeName}>{o.storeName}</option>
                    ))}
                  </select>
                </div>
              )}

              {alertMessage && (
                <div style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: alertMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  color: alertMessage.type === 'success' ? '#166534' : '#991b1b',
                  border: alertMessage.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca'
                }}>
                  {alertMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{alertMessage.text}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={alertLoading}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {alertLoading ? 'جاري التسجيل...' : 'حفظ التنبيه'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  style={{
                    padding: '0.65rem 1rem',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
