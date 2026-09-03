'use client';
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

// ── types ──────────────────────────────────────────────────────────────
interface SocialLink { platform: string; url: string; }
interface Section { id: string; title: string; type: string; category?: string; productIds?: string[]; enabled: boolean; order: number; isFeatured?: boolean; parentId?: string; image?: string; icon?: string; }
interface DailyDeal { id: string; productId: string; offerPrice?: string; startDate?: string; endDate?: string; enabled: boolean; order: number; }

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'snapchat', label: 'Snapchat' },
];

const SECTION_TYPES = [
  { key: 'manual_products', label: 'منتجات يدوية', desc: 'تختار المنتجات بنفسك. القسم يبدأ فارغًا.' },
  { key: 'category_section', label: 'منتجات فئة معينة', desc: 'يعرض تلقائيًا المنتجات التابعة للفئة التي تختارها.' },
  { key: 'daily_deals', label: 'العروض اليومية', desc: 'يعرض المنتجات التي تم تعيينها كعروض يومية.' },
  { key: 'new_arrivals', label: 'وصل حديثاً', desc: 'يعرض أحدث المنتجات المضافة فعليًا إلى المتجر.' },
  { key: 'best_sellers', label: 'الأكثر مبيعاً', desc: 'يعتمد على بيانات الطلبات والمبيعات الحقيقية.' },
  { key: 'recommended', label: 'منتجات مقترحة', desc: 'يعتمد على المنتجات المقترحة الحقيقية المتاحة.' },
  { key: 'all_products', label: 'جميع المنتجات', desc: 'يعرض جميع المنتجات الموجودة في المتجر.' },
  { key: 'banner', label: 'بنر ترويجي', desc: 'قسم لعرض صورة ترويجية أو إعلان.' },
];

const PANEL: React.CSSProperties = {
  background: 'var(--surface-color)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  marginBottom: '1.5rem',
  overflow: 'hidden',
};

const PANEL_HEADER: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)',
  cursor: 'pointer', userSelect: 'none',
};

const PANEL_BODY: React.CSSProperties = { padding: '1.5rem' };

const BADGE = (enabled: boolean): React.CSSProperties => ({
  display: 'inline-block', padding: '0.15rem 0.6rem',
  borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
  background: enabled ? '#dcfce7' : '#fee2e2',
  color: enabled ? '#166534' : '#991b1b',
});

// ── helper component ───────────────────────────────────────────────────
function CollapsePanel({ title, icon, defaultOpen = false, children }: {
  title: string; icon: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={PANEL}>
      <div style={PANEL_HEADER} onClick={() => setOpen(o => !o)}>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{icon} {title}</span>
        <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={PANEL_BODY}>{children}</div>}
    </div>
  );
}

function ProductOffersEditor({ productId, autoAddStoreName, productTitle }: { productId: string, autoAddStoreName?: string, productTitle?: string }) {
  const [stores, setStores] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(!!autoAddStoreName);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    storeId: '', affiliateUrl: '', price: '', originalPrice: '', availability: 'in_stock'
  });

  const fetchOffers = () => {
    fetch(`/api/product-offers?productId=${productId}`).then(r => r.json()).then(setOffers);
  };

  useEffect(() => {
    if (autoAddStoreName) setAdding(true);
    fetch('/api/stores').then(r => r.json()).then(data => {
      setStores(data);
      if (autoAddStoreName) {
        const store = data.find((s: any) => s.name.toLowerCase().includes(autoAddStoreName.toLowerCase()));
        if (store) {
          setFormData(prev => ({ ...prev, storeId: store.id }));
        }
      }
    });
    fetchOffers();
    setLoading(false);
  }, [productId, autoAddStoreName]);

  const handleSave = async () => {
    if (!formData.storeId || !formData.affiliateUrl || !formData.price) return alert('اختر المتجر، السعر، والرابط');
    if (editingOfferId) {
      await fetch(`/api/product-offers/${editingOfferId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
    } else {
      await fetch('/api/product-offers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, productId })
      });
    }
    
    if (!autoAddStoreName) {
      setAdding(false);
    } else {
      setFormData({ storeId: formData.storeId, affiliateUrl: '', price: '', originalPrice: '', availability: 'in_stock' });
      alert('✅ تم إضافة العرض بنجاح!');
    }
    
    setEditingOfferId(null); fetchOffers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا العرض؟')) return;
    await fetch(`/api/product-offers/${id}`, { method: 'DELETE' });
    fetchOffers();
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', outline: 'none' };
  const btnStyle = { padding: '0.4rem 0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
      <h4 style={{ margin: '0 0 1rem 0' }}>{autoAddStoreName ? `إضافة عرض ${autoAddStoreName}` : 'عروض المتاجر (Multi-Store Offers)'}</h4>
      
      {autoAddStoreName && productTitle && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
          <strong style={{ color: '#1e3a8a' }}>المنتج:</strong> <span style={{ color: '#1e40af' }}>{productTitle}</span>
        </div>
      )}

      {!autoAddStoreName && offers.map(o => (
        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <strong>{o.stores?.name}</strong> - {o.price} {o.currency}
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{o.affiliate_url}</div>
          </div>
          <div>
            <button style={{...btnStyle, background: '#e2e8f0', color: '#334155', marginLeft: '0.5rem'}} onClick={() => { setEditingOfferId(o.id); setFormData({ storeId: o.store_id, affiliateUrl: o.affiliate_url, price: o.price, originalPrice: o.original_price || '', availability: o.availability }); setAdding(true); }}>تعديل</button>
            <button style={{...btnStyle, background: '#ef4444'}} onClick={() => handleDelete(o.id)}>حذف</button>
          </div>
        </div>
      ))}
      
      {adding ? (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
          {!autoAddStoreName ? (
            <select style={inputStyle} value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})} disabled={!!editingOfferId}>
              <option value="">-- اختر المتجر --</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          ) : (
            <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#e2e8f0', borderRadius: 'var(--radius-md)', fontWeight: 600, color: '#334155' }}>
              المتجر: {autoAddStoreName} (محدد تلقائياً)
            </div>
          )}
          <input style={{...inputStyle, direction: 'ltr'}} placeholder="رابط المتجر (Affiliate Link)" value={formData.affiliateUrl} onChange={e => setFormData({...formData, affiliateUrl: e.target.value})} />
          <p style={{fontSize: '0.75rem', color: '#64748b', marginTop: '-0.3rem', marginBottom: '0.5rem'}}>الصق الرابط المختصر الذي حصلت عليه (مثال: https://s.noon.com/...)</p>
          <input style={inputStyle} placeholder="السعر الحالي (أرقام فقط)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          <input style={inputStyle} placeholder="السعر الأصلي (اختياري)" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} />
          <select style={inputStyle} value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})}>
            <option value="in_stock">متوفر (In Stock)</option>
            <option value="out_of_stock">غير متوفر (Out of Stock)</option>
            <option value="unknown">غير معروف (Unknown)</option>
          </select>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button style={btnStyle} onClick={handleSave}>حفظ العرض</button>
            {!autoAddStoreName && (
              <button style={{...btnStyle, background: '#e2e8f0', color: '#334155'}} onClick={() => { setAdding(false); setEditingOfferId(null); }}>إلغاء</button>
            )}
          </div>
        </div>
      ) : (
        <button style={{...btnStyle, marginTop: '1rem'}} onClick={() => { setAdding(true); setFormData({ storeId: '', affiliateUrl: '', price: '', originalPrice: '', availability: 'in_stock' }); }}>＋ إضافة عرض جديد</button>
      )}
      
      {autoAddStoreName && offers.length > 0 && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <h5 style={{ margin: '0 0 1rem 0' }}>العروض الحالية للمنتج:</h5>
          {offers.map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', marginBottom: '0.5rem', borderRadius: '4px' }}>
              <div>
                <strong>{o.stores?.name}</strong> - {o.price} {o.currency}
              </div>
              <button style={{...btnStyle, background: '#ef4444', padding: '0.2rem 0.5rem', fontSize: '0.8rem'}} onClick={() => handleDelete(o.id)}>حذف</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('الرئيسية');
  const [isMobile, setIsMobile] = useState(false);
  const msg = (t: string) => { setMessage(t); setTimeout(() => setMessage(''), 3000); };

  // ── Affiliate / Amazon / Noon settings ──
  const [trackingId, setTrackingId] = useState('');
  const [noonTrackingId, setNoonTrackingId] = useState('AFF72733841fe2f');
  const [facebookPixelId, setFacebookPixelId] = useState('');

  // ── Social links ──
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [addingLink, setAddingLink] = useState(false);
  const [newPlatform, setNewPlatform] = useState('facebook');
  const [newUrl, setNewUrl] = useState('');
  const [editingLinkIdx, setEditingLinkIdx] = useState<number | null>(null);

  // ── Sections (Includes Categories) ──
  const [sections, setSections] = useState<Section[]>([]);
  
  // Homepage Sections
  const [addingSection, setAddingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [newSection, setNewSection] = useState<Partial<Section>>({ title: '', type: 'all_products', category: '' });

  // Product Categories
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Section>>({ title: '', type: 'products_by_category', enabled: true, isFeatured: false, parentId: '', image: '', icon: '' });
  const [editingCategory, setEditingCategory] = useState<Section | null>(null);

  // ── Categories specifically (computed from sections) ──
  const categorySections = sections.filter(s => s.type === 'products_by_category').sort((a,b) => a.order - b.order);
  const homepageSections = sections.filter(s => s.type !== 'products_by_category').sort((a,b) => a.order - b.order);

  // ── Products ──
  const [urls, setUrls] = useState('');
  const [scrapeCategory, setScrapeCategory] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [noonSelectedProductId, setNoonSelectedProductId] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [showProducts, setShowProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  // ── Daily Deals ──
  const [dailyDeals, setDailyDeals] = useState<DailyDeal[]>([]);
  const [addingDeal, setAddingDeal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DailyDeal | null>(null);
  const [newDeal, setNewDeal] = useState<Partial<DailyDeal>>({ productId: '', offerPrice: '', startDate: '', endDate: '' });

  // ── Data Fetching & Setup ──
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.trackingId) setTrackingId(d.trackingId);
      if (d.noonTrackingId) setNoonTrackingId(d.noonTrackingId);
      if (d.facebookPixelId) setFacebookPixelId(d.facebookPixelId);
      if (d.socialLinks) setSocialLinks(d.socialLinks);
    });
    fetch('/api/sections').then(r => r.json()).then(setSections).catch(() => setSections([]));
    fetch('/api/daily_deals').then(r => r.json()).then(setDailyDeals).catch(() => setDailyDeals([]));
    
    // Fetch products once to be used in dropdowns (Daily Deals, Manual Products, etc)
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => setProducts([]));

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startEditLink = (i: number) => {
    setEditingLinkIdx(i);
    setNewPlatform(socialLinks[i].platform);
    setNewUrl(socialLinks[i].url);
  };

  // ── Save Settings Handlers ──
  const saveAmazonSettings = async () => {
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingId, facebookPixelId }),
    });
    msg('✅ تم حفظ إعدادات أمازون بنجاح.');
  };

  const saveNoonSettings = async () => {
    if (!noonTrackingId || !noonTrackingId.trim()) {
      alert('خطأ: يرجى إدخال Noon Affiliate Tag صحيح.');
      return;
    }
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noonTrackingId: noonTrackingId.trim() }),
    });
    msg('✅ تم حفظ Noon Affiliate Tag بنجاح.');
  };

  // ── Social link helpers ──
  const addSocialLink = () => {
    if (!newUrl.trim()) return;
    const updated = [...socialLinks, { platform: newPlatform, url: newUrl.trim() }];
    setSocialLinks(updated); setNewUrl(''); setAddingLink(false); saveSocialLinks(updated);
  };
  const removeSocialLink = (i: number) => {
    const updated = socialLinks.filter((_, idx) => idx !== i);
    setSocialLinks(updated); saveSocialLinks(updated);
  };
  const saveEditLink = () => {
    if (editingLinkIdx === null) return;
    const updated = socialLinks.map((l, i) => i === editingLinkIdx ? { platform: newPlatform, url: newUrl } : l);
    setSocialLinks(updated); setEditingLinkIdx(null); setNewUrl(''); saveSocialLinks(updated);
  };
  const saveSocialLinks = async (links: SocialLink[]) => {
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingId, facebookPixelId, socialLinks: links }),
    });
    msg('✅ تم حفظ روابط التواصل');
  };

  // ── Products ──
  const [scrapeStatus, setScrapeStatus] = useState<{ url: string; status: 'Processing' | 'Success' | 'Failed' | 'Duplicate' | 'NeedsInput'; message?: string; product?: any; needsPrice?: boolean; needsCategory?: boolean }[]>([]);
  const [previewProduct, setPreviewProduct] = useState<any>(null);

  const handleScrape = async (isPreview = false) => {
    if (!urls.trim()) return;
    setScrapeLoading(true); setMessage('');
    const urlArray = urls.split('\n').filter(u => u.trim() !== '');
    const targetCategory = scrapeCategory || categorySections[0]?.category || 'General';
    
    type StatusItem = { url: string; status: 'Processing' | 'Success' | 'Failed' | 'Duplicate' | 'NeedsInput'; message?: string; product?: any; needsPrice?: boolean; needsCategory?: boolean };
    const initialStatus: StatusItem[] = urlArray.map(url => ({ url, status: 'Processing' }));
    setScrapeStatus(initialStatus);

    let successCount = 0;
    const newStatus = [...initialStatus];

    for (let i = 0; i < urlArray.length; i++) {
      const url = urlArray[i];
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, category: targetCategory, preview: isPreview }),
        });
        const data = await res.json();
        if (data.success) {
          if (isPreview) {
            setPreviewProduct(data.product);
            setScrapeLoading(false);
            return;
          }
          newStatus[i].status = 'Success';
          successCount++;
        } else {
          newStatus[i].status = data.status || 'Failed';
          newStatus[i].message = data.error || 'حدث خطأ';
          if (data.status === 'NeedsInput') {
            newStatus[i].product = data.product;
            newStatus[i].needsPrice = data.needsPrice;
            newStatus[i].needsCategory = data.needsCategory;
          }
        }
      } catch (err) {
        newStatus[i].status = 'Failed';
        newStatus[i].message = 'Network error';
      }
      setScrapeStatus([...newStatus]);
    }
    
    msg(`تم الانتهاء: نجاح ${successCount} من ${urlArray.length}`);
    setUrls('');
    fetchProducts();
    setScrapeLoading(false);
  };

  const updateScrapeStatusProduct = (idx: number, field: string, value: any) => {
    const newStatus = [...scrapeStatus];
    if (newStatus[idx].product) {
      newStatus[idx].product = { ...newStatus[idx].product, [field]: value };
      setScrapeStatus(newStatus);
    }
  };

  const handleSaveManualProduct = async (idx: number) => {
    const s = scrapeStatus[idx];
    if (!s || !s.product) return;
    
    const p = s.product;
    
    // Validation
    if (s.needsPrice && (!p.price || p.price.trim() === '')) {
      alert('السعر الحالي مطلوب'); return;
    }
    if (s.needsCategory && (!p.category || p.category.trim() === '')) {
      alert('الفئة مطلوبة'); return;
    }
    
    if (p.originalPrice && p.price) {
      const currentVal = parseFloat(p.price.replace(/[^\d.]/g, ''));
      const origVal = parseFloat(p.originalPrice.replace(/[^\d.]/g, ''));
      if (!isNaN(currentVal) && !isNaN(origVal) && origVal <= currentVal) {
        alert('السعر قبل الخصم يجب أن يكون أكبر من السعر الحالي'); return;
      }
    }

    // Formatting price
    let finalPrice = p.price;
    if (finalPrice && !finalPrice.toLowerCase().includes('egp')) finalPrice += ' EGP';
    let finalOrig = p.originalPrice;
    if (finalOrig && !finalOrig.toLowerCase().includes('egp')) finalOrig += ' EGP';
    
    p.price = finalPrice;
    p.originalPrice = finalOrig;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newStatus = [...scrapeStatus];
        newStatus[idx].status = 'Success';
        newStatus[idx].message = '';
        setScrapeStatus(newStatus);
        fetchProducts();
        msg('✅ تم حفظ المنتج بنجاح');
      } else {
        alert('خطأ أثناء الحفظ: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  // ── Noon Import State & Handlers ──
  const [noonInputUrl, setNoonInputUrl] = useState('');
  const [noonScrapeLoading, setNoonScrapeLoading] = useState(false);
  const [noonImportData, setNoonImportData] = useState<any>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{ category: string, categoryTitle: string, confidence: number, reason: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleNoonScrape = async () => {
    if (!noonInputUrl.trim()) return;
    setNoonScrapeLoading(true); setMessage('');
    setAiSuggestion(null); setAiError('');
    try {
      const res = await fetch('/api/noon-scrape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: noonInputUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNoonImportData({ ...data.data, categoryId: scrapeCategory || categorySections[0]?.category || '' });
        
        // Fetch AI Category Suggestion
        setAiLoading(true);
        try {
          const aiRes = await fetch('/api/categorize', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: data.data.title,
              description: data.data.description,
              store: 'Noon'
            })
          });
          const aiData = await aiRes.json();
          if (aiData.success) {
            setAiSuggestion({
              category: aiData.category,
              categoryTitle: aiData.categoryTitle,
              confidence: aiData.confidence,
              reason: aiData.reason
            });
          } else {
            setAiError(aiData.error || 'Failed to get suggestion');
          }
        } catch (err) {
          setAiError('Network error during AI categorization');
        }
        setAiLoading(false);
        
      } else {
        msg(`خطأ: ${data.error}`);
      }
    } catch (err) {
      msg('حدث خطأ أثناء الاتصال بالخادم');
    }
    setNoonScrapeLoading(false);
  };

  const handleNoonSave = async () => {
    if (!noonImportData) return;
    setNoonScrapeLoading(true);
    try {
      // Validations (No silent fallbacks)
      if (!noonImportData.price || String(noonImportData.price).trim() === '' || noonImportData.price === 'Price unavailable') {
        msg('تعذر استخراج السعر — يرجى إدخاله يدويًا.');
        setNoonScrapeLoading(false); return;
      }
      
      if (!noonImportData.categoryId || noonImportData.categoryId === 'General' || noonImportData.categoryId === 'غير مصنف') {
        msg('لم يتم تحديد الفئة — يرجى اختيار الفئة يدويًا.');
        setNoonScrapeLoading(false); return;
      }

      // 1. Fetch stores to find Noon ID
      const storesRes = await fetch('/api/stores');
      const storesData = await storesRes.json();
      const noonStore = storesData.find((s: any) => s.name.toLowerCase().includes('noon'));
      if (!noonStore) {
        msg('خطأ: لم يتم العثور على متجر Noon في قاعدة البيانات.');
        setNoonScrapeLoading(false); return;
      }

      // 2. Insert Product (if not duplicate)
      let productId = noonImportData.existingProductId;
      
      if (!noonImportData.isDuplicate) {
        const productBody = {
          id: noonImportData.predictedId,
          originalUrl: noonImportData.originalUrl,
          title: noonImportData.title,
          description: noonImportData.description,
          price: noonImportData.price,
          originalPrice: noonImportData.originalPrice,
          image: noonImportData.image,
          images: noonImportData.images || [],
          category: noonImportData.categoryId,
        };

        const prodRes = await fetch('/api/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productBody)
        });
        const prodData = await prodRes.json();
        if (!prodRes.ok || !prodData.success) {
          msg(`خطأ في حفظ المنتج: ${prodData.error || 'Server error'}`);
          setNoonScrapeLoading(false); return;
        }
        productId = prodData.product.id;
      }

      // 3. Insert Offer
      const offerBody = {
        productId: productId,
        storeId: noonStore.id,
        affiliateUrl: noonInputUrl || noonImportData.originalUrl || '',
        price: noonImportData.price,
        originalPrice: noonImportData.originalPrice || '',
        availability: noonImportData.availability || 'in_stock'
      };

      const offerRes = await fetch('/api/product-offers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerBody)
      });
      const offerData = await offerRes.json();
      if (!offerRes.ok) {
        msg(`خطأ في حفظ العرض: ${offerData.error || 'Server error'}`);
        setNoonScrapeLoading(false); return;
      } else {
        msg('✅ تم إنشاء المنتج وعرض Noon بنجاح!');
        setNoonInputUrl('');
        setNoonImportData(null);
        setAiSuggestion(null);
        fetchProducts();
      }
    } catch (err) {
      msg('حدث خطأ أثناء الحفظ');
    }
    setNoonScrapeLoading(false);
  };

  const fetchProducts = async () => {
    const url = filterCategory === 'All' ? '/api/products' : `/api/products?category=${filterCategory}`;
    const data = await fetch(url).then(r => r.json());
    setProducts(data); setShowProducts(true);
    if (data.length === 0) msg('لا توجد منتجات.');
  };

  const handleEditClick = (p: any) => {
    setEditingProduct(p.id);
    setEditData({ ...p, images: p.images ? p.images.join('\n') : '' });
  };

  const handleSaveProduct = async () => {
    const pd = { ...editData };
    if (typeof pd.images === 'string') pd.images = pd.images.split('\n').filter((u: string) => u.trim() !== '');
    await fetch(`/api/products/${editingProduct}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pd),
    });
    setEditingProduct(null); msg('✅ تم تحديث المنتج'); fetchProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('حذف هذا المنتج؟')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) { msg('✅ تم الحذف'); fetchProducts(); }
  };



  // ── Categories & Sections Handlers ──
  const addCategory = async () => {
    if (!newCategory.title?.trim()) return msg('أدخل اسم الفئة');
    const generatedCatId = 'cat_' + Math.random().toString(36).substr(2, 9);
    const body = { 
      ...newCategory, 
      category: generatedCatId, 
      type: 'products_by_category',
      parentId: newCategory.parentId || null 
    };
    const res = await fetch('/api/sections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setSections(s => [...s, data.section]);
      setNewCategory({ title: '', type: 'products_by_category', enabled: true, isFeatured: false, parentId: '', image: '', icon: '' });
      setAddingCategory(false); msg('✅ تم إضافة الفئة');
      router.refresh();
    }
  };

  const addSection = async () => {
    if (!newSection.title?.trim()) return msg('أدخل عنوان القسم');
    const res = await fetch('/api/sections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSection),
    });
    if (res.ok) {
      const data = await res.json();
      setSections(s => [...s, data.section]);
      setNewSection({ title: '', type: 'all_products', category: '' });
      setAddingSection(false); msg('✅ تم إضافة القسم');
      router.refresh();
    }
  };
  const saveEditSection = async (sec: Section) => {
    if (!sec) return;
    const res = await fetch(`/api/sections/${sec.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sec),
    });
    if (res.ok) {
      const data = await res.json();
      setSections(ss => ss.map(s => s.id === sec.id ? data.section : s));
      setEditingSection(null); setEditingCategory(null); msg('✅ تم تحديث القسم');
      router.refresh();
    }
  };
  const toggleSection = async (sec: Section) => {
    const res = await fetch(`/api/sections/${sec.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !sec.enabled }),
    });
    if (res.ok) { 
      const data = await res.json(); 
      setSections(ss => ss.map(s => s.id === sec.id ? data.section : s)); 
      router.refresh();
    }
  };
  const deleteSection = async (id: string) => {
    if (!confirm('حذف هذا القسم أو الفئة؟')) return;
    await fetch(`/api/sections/${id}`, { method: 'DELETE' });
    setSections(ss => ss.filter(s => s.id !== id)); msg('✅ تم الحذف بنجاح');
    router.refresh();
  };

  // ── Daily Deals ──
  const addDeal = async () => {
    if (!newDeal.productId) return msg('اختر المنتج أولاً');
    const res = await fetch('/api/daily_deals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDeal),
    });
    if (res.ok) {
      const deal = await res.json();
      setDailyDeals(d => [...d, deal]);
      setNewDeal({ productId: '', offerPrice: '', startDate: '', endDate: '' });
      setAddingDeal(false); msg('✅ تم إضافة العرض');
    }
  };
  const saveEditDeal = async () => {
    if (!editingDeal) return;
    const res = await fetch(`/api/daily_deals/${editingDeal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingDeal),
    });
    if (res.ok) {
      const { deal } = await res.json();
      setDailyDeals(d => d.map(x => x.id === deal.id ? deal : x));
      setEditingDeal(null); msg('✅ تم تحديث العرض');
    }
  };
  const toggleDeal = async (deal: DailyDeal) => {
    const res = await fetch(`/api/daily_deals/${deal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !deal.enabled }),
    });
    if (res.ok) { const { deal: updated } = await res.json(); setDailyDeals(d => d.map(x => x.id === updated.id ? updated : x)); }
  };
  const deleteDeal = async (id: string) => {
    if (!confirm('حذف هذا العرض؟')) return;
    await fetch(`/api/daily_deals/${id}`, { method: 'DELETE' });
    setDailyDeals(d => d.filter(x => x.id !== id)); msg('✅ تم الحذف');
  };


  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' };
  const btnPrimary: React.CSSProperties = { padding: '0.6rem 1.25rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' };
  const btnDanger: React.CSSProperties = { ...btnPrimary, background: '#ef4444' };
  const btnGhost: React.CSSProperties = { ...btnPrimary, background: '#e2e8f0', color: '#334155' };

  const TABS = [
    { id: 'الرئيسية', icon: '🏠', label: 'الرئيسية' },
    { id: 'المنتجات', icon: '📦', label: 'المنتجات' },
    { id: 'استيراد المنتجات', icon: '⬇️', label: 'استيراد المنتجات' },
    { id: 'المتاجر', icon: '🏪', label: 'المتاجر' },
    { id: 'التصنيفات', icon: '📑', label: 'التصنيفات' },
    { id: 'الإعدادات', icon: '⚙️', label: 'الإعدادات' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', direction: 'rtl', background: '#f8fafc', color: '#1e293b', fontFamily: 'inherit' }}>
      {/* Sidebar */}
      <div style={{ width: isMobile ? '100%' : '260px', flexShrink: 0, background: '#fff', borderLeft: isMobile ? 'none' : '1px solid #e2e8f0', borderBottom: isMobile ? '1px solid #e2e8f0' : 'none', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', wordBreak: 'break-word' }}>لوحة التحكم</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', wordBreak: 'break-word' }}>Bkam El-Naharda Admin</p>
        </div>
        <nav style={{ flex: 1, padding: '1rem', boxSizing: 'border-box', overflowY: 'auto', maxHeight: isMobile ? '300px' : 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {TABS.map(tab => (
              <li key={tab.id} style={{ width: '100%' }}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%', textAlign: 'right', padding: '0.85rem 1rem',
                    background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                    color: activeTab === tab.id ? '#2563eb' : '#475569',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    transition: 'all 0.2s', fontSize: '0.95rem',
                    boxSizing: 'border-box', overflow: 'hidden', whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{tab.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: isMobile ? '1rem' : '2rem', boxSizing: 'border-box', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {message && (
            <div style={{ marginBottom: '1.5rem', padding: '0.8rem 1.25rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
              {message}
            </div>
          )}

      {/* ── 1. Categories (إدارة تصنيفات المنتجات) ── */}
      {activeTab === 'التصنيفات' && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>إدارة تصنيفات المنتجات</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {categorySections.map(sec => (
            <div key={sec.id}>
              {editingCategory?.id === sec.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <input style={inputStyle} value={editingCategory.title} onChange={e => setEditingCategory({ ...editingCategory, title: e.target.value })} placeholder="اسم الفئة" />
                  
                  <select style={inputStyle} value={editingCategory.parentId || ''} onChange={e => setEditingCategory({ ...editingCategory, parentId: e.target.value })}>
                    <option value="">-- بدون فئة أب (فئة رئيسية) --</option>
                    {categorySections.filter(c => c.id !== sec.id && !c.parentId).map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>

                  <input style={inputStyle} value={editingCategory.image || ''} onChange={e => setEditingCategory({ ...editingCategory, image: e.target.value })} placeholder="رابط صورة الفئة (اختياري، للرئيسية)" />
                  <input style={inputStyle} value={editingCategory.icon || ''} onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })} placeholder="أيقونة الفئة (اختياري، إيموجي أو نص)" />

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={editingCategory.isFeatured || false} onChange={e => setEditingCategory({ ...editingCategory, isFeatured: e.target.checked })} />
                    <span style={{ fontWeight: 600 }}>إظهار في قسم "تسوق حسب الفئات" (Featured)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}><button style={btnPrimary} onClick={() => saveEditSection(editingCategory)}>حفظ</button><button style={btnGhost} onClick={() => setEditingCategory(null)}>إلغاء</button></div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700, flex: 1 }}>
                    {sec.icon && <span style={{ marginLeft: '0.5rem' }}>{sec.icon}</span>}
                    {sec.title}
                    {sec.parentId && <span style={{ color: '#64748b', fontSize: '0.85rem', marginRight: '0.5rem' }}> ← تابعة لـ {categorySections.find(c => c.id === sec.parentId)?.title}</span>}
                  </span>
                  <span style={BADGE(sec.enabled)}>{sec.enabled ? 'مفعّل' : 'معطّل'}</span>
                  {sec.isFeatured && <span style={{ ...BADGE(true), background: '#fef3c7', color: '#92400e' }}>مميزة</span>}
                  <button style={btnGhost} onClick={() => setEditingCategory(sec)}>تعديل</button>
                  <button style={{ ...btnGhost, background: sec.enabled ? '#fef9c3' : '#dcfce7' }} onClick={() => toggleSection(sec)}>{sec.enabled ? 'تعطيل' : 'تفعيل'}</button>
                  <button style={btnDanger} onClick={() => deleteSection(sec.id)}>حذف</button>
                </div>
              )}
            </div>
          ))}

          {addingCategory ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#f0f9ff', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd' }}>
              <input style={inputStyle} value={newCategory.title} onChange={e => setNewCategory({ ...newCategory, title: e.target.value })} placeholder="اسم الفئة" />
              
              <select style={inputStyle} value={newCategory.parentId || ''} onChange={e => setNewCategory({ ...newCategory, parentId: e.target.value })}>
                <option value="">-- بدون فئة أب (فئة رئيسية) --</option>
                {categorySections.filter(c => !c.parentId).map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              <input style={inputStyle} value={newCategory.image || ''} onChange={e => setNewCategory({ ...newCategory, image: e.target.value })} placeholder="رابط صورة الفئة (اختياري، للرئيسية)" />
              <input style={inputStyle} value={newCategory.icon || ''} onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })} placeholder="أيقونة الفئة (اختياري، إيموجي أو نص)" />

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={newCategory.isFeatured || false} onChange={e => setNewCategory({ ...newCategory, isFeatured: e.target.checked })} />
                <span style={{ fontWeight: 600 }}>إظهار في قسم "تسوق حسب الفئات" (Featured)</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}><button style={btnPrimary} onClick={addCategory}>إضافة</button><button style={btnGhost} onClick={() => setAddingCategory(false)}>إلغاء</button></div>
            </div>
          ) : (
            <button style={{ ...btnPrimary, alignSelf: 'flex-start' }} onClick={() => setAddingCategory(true)}>＋ إضافة فئة</button>
          )}
        </div>
        </div>
      )}

      {/* ── Products Import (استيراد المنتجات) ── */}
      {activeTab === 'استيراد المنتجات' && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>استيراد وإضافة المنتجات</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Amazon Section */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📦</span> Amazon (استيراد تلقائي)
              </h3>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>روابط المنتجات (رابط في كل سطر)</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', marginBottom: '1rem' }} rows={4} value={urls} onChange={e => setUrls(e.target.value)} placeholder={'https://www.amazon.eg/...\nhttps://www.amazon.eg/...'} dir="ltr" />
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>الفئة (Category)</label>
              <select style={{ ...inputStyle, marginBottom: '1rem' }} value={scrapeCategory} onChange={e => setScrapeCategory(e.target.value)}>
                <option value="">-- اختر الفئة --</option>
                {categorySections.map(c => <option key={c.id} value={c.category}>{c.title}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button style={{ ...btnGhost, flex: 1 }} onClick={() => handleScrape(true)} disabled={scrapeLoading || !urls.trim() || urls.split('\n').filter(u => u.trim()).length > 1}>
                  {scrapeLoading ? 'جاري المعالجة...' : 'معاينة (رابط واحد)'}
                </button>
                <button style={{ ...btnPrimary, flex: 1 }} onClick={() => handleScrape(false)} disabled={scrapeLoading || !urls.trim()}>
                  {scrapeLoading ? 'جاري الاستيراد...' : 'استيراد وحفظ'}
                </button>
              </div>
              
              {previewProduct && (
                <div style={{ marginTop: '1.5rem', background: '#fff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>معاينة المنتج</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <img src={previewProduct.image} alt={previewProduct.title} style={{ width: '60px', height: '60px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                    <div>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '0.9rem' }}>{previewProduct.title}</h5>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                        السعر: <strong style={{ color: '#16a34a' }}>{previewProduct.price}</strong> 
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#475569' }}>
                        الفئة: <strong>{previewProduct.category}</strong>
                      </p>
                    </div>
                  </div>
                  <button style={{ ...btnGhost, padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginTop: '1rem' }} onClick={() => setPreviewProduct(null)}>إغلاق</button>
                </div>
              )}
              
              {scrapeStatus.length > 0 && (
                <div style={{ marginTop: '1.5rem', background: '#fff', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', maxHeight: '300px', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>حالة الاستيراد ({scrapeStatus.filter(s => s.status === 'Success').length}/{scrapeStatus.length}):</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {scrapeStatus.map((s, idx) => (
                      <div key={idx} style={{ 
                        padding: '0.6rem 0.8rem', borderRadius: '0.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        background: s.status === 'Processing' ? '#f8fafc' : s.status === 'Success' ? '#f0fdf4' : s.status === 'Duplicate' ? '#fffbeb' : s.status === 'NeedsInput' ? '#fff7ed' : '#fef2f2',
                        border: `1px solid ${s.status === 'Processing' ? '#e2e8f0' : s.status === 'Success' ? '#bbf7d0' : s.status === 'Duplicate' ? '#fef3c7' : s.status === 'NeedsInput' ? '#ffedd5' : '#fecaca'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '75%', overflow: 'hidden' }}>
                            <span style={{ direction: 'ltr', textAlign: 'left', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#475569' }}>{s.url}</span>
                            {s.message && <span style={{ color: s.status === 'Failed' ? '#dc2626' : s.status === 'NeedsInput' ? '#ea580c' : '#d97706', fontWeight: 600 }}>{s.status === 'NeedsInput' ? 'يحتاج إلى استكمال البيانات' : s.message}</span>}
                          </div>
                          <div>
                            {s.status === 'Processing' && <span style={{ color: '#64748b', fontWeight: 600 }}>معالجة...</span>}
                            {s.status === 'Success' && <span style={{ color: '#166534', fontWeight: 700 }}>✅</span>}
                            {s.status === 'Failed' && <span style={{ color: '#991b1b', fontWeight: 700 }}>❌</span>}
                            {s.status === 'Duplicate' && <span style={{ color: '#b45309', fontWeight: 700 }}>⚠️</span>}
                            {s.status === 'NeedsInput' && <span style={{ color: '#ea580c', fontWeight: 700 }}>يحتاج إدخالاً</span>}
                          </div>
                        </div>

                        {s.status === 'NeedsInput' && s.product && (
                          <div style={{ padding: '0.75rem', borderTop: '1px solid #fed7aa', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <img src={s.product.image} alt="product" style={{ width: 40, height: 40, objectFit: 'contain', backgroundColor: 'white', borderRadius: 4, border: '1px solid #e2e8f0' }} />
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                                {s.product.title}
                              </div>
                            </div>
                            
                            {s.needsPrice && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#ea580c', marginBottom: '0.25rem' }}>❌ السعر الحالي — مطلوب</label>
                                  <input 
                                    style={{ ...inputStyle, marginBottom: 0, borderColor: '#ea580c' }} 
                                    placeholder="أرقام فقط (مثال: 2750)"
                                    value={s.product.price || ''}
                                    onChange={e => updateScrapeStatusProduct(idx, 'price', e.target.value)}
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>السعر قبل الخصم — اختياري</label>
                                  <input 
                                    style={{ ...inputStyle, marginBottom: 0 }} 
                                    placeholder="اختياري (أرقام فقط)"
                                    value={s.product.originalPrice || ''}
                                    onChange={e => updateScrapeStatusProduct(idx, 'originalPrice', e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {s.needsCategory && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#ea580c', marginBottom: '0.25rem' }}>❌ الفئة — مطلوبة</label>
                                <select 
                                  style={{ ...inputStyle, marginBottom: 0, borderColor: '#ea580c' }}
                                  value={s.product.category || ''}
                                  onChange={e => updateScrapeStatusProduct(idx, 'category', e.target.value)}
                                >
                                  <option value="">-- اختر الفئة يدوياً --</option>
                                  {categorySections.map(c => <option key={c.category} value={c.category}>{c.title}</option>)}
                                </select>
                              </div>
                            )}

                            <div style={{ marginTop: '0.5rem', textAlign: 'left' }}>
                              <button 
                                style={{ ...btnPrimary, fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                                onClick={() => handleSaveManualProduct(idx)}
                                disabled={(s.needsPrice && !s.product.price) || (s.needsCategory && !s.product.category)}
                              >
                                حفظ المنتج
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Noon Section */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🛍️</span> إضافة منتج من Noon (يدوي/آلي)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>الصق رابط Noon لجلب بيانات المنتج تلقائياً وإضافته كمنتج جديد مع عرض Noon.</p>
              
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>رابط المنتج على Noon</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input style={{ ...inputStyle, marginBottom: 0, flex: 1, direction: 'ltr' }} value={noonInputUrl} onChange={e => setNoonInputUrl(e.target.value)} placeholder="https://www.noon.com/..." />
                <button style={{ ...btnPrimary, whiteSpace: 'nowrap' }} onClick={handleNoonScrape} disabled={noonScrapeLoading || !noonInputUrl.trim()}>
                  {noonScrapeLoading ? 'جاري التحميل...' : 'جلب بيانات المنتج'}
                </button>
              </div>

              {noonImportData && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>مراجعة وتعديل بيانات المنتج</h4>
                  
                  {noonImportData.isDuplicate ? (
                     <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
                        ⚠️ هذا المنتج مرتبط بالفعل بـ Master Product ({noonImportData.existingProductId}). عند الحفظ سيتم فقط إضافة عرض Noon إليه دون تكراره.
                        <button style={{ marginRight: '1rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#ffffff', border: '1px solid #d97706', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setNoonImportData({ ...noonImportData, isDuplicate: false, existingProductId: null })}>
                          فك الربط وإضافة كمنتج جديد مستقل
                        </button>
                     </div>
                  ) : (
                    (() => {
                      const words = noonImportData.title ? noonImportData.title.toLowerCase().split(' ').filter((w: string) => w.length > 2) : [];
                      const matches = products.filter(p => {
                        const pTitle = p.title.toLowerCase();
                        const matchCount = words.filter((w: string) => pTitle.includes(w)).length;
                        return matchCount >= 2;
                      }).slice(0, 3);

                      if (matches.length === 0) return null;

                      return (
                        <div style={{ padding: '0.85rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', marginBottom: '1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>🔍</span> تم العثور على منتجات مشابهة في المعرض! هل تريد ربط عرض Noon بمنتج موجود؟
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {matches.map(m => (
                              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: '#ffffff', border: '1px solid #e0f2fe', borderRadius: '4px', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                  <img src={m.image} alt={m.title} style={{ width: 30, height: 30, objectFit: 'contain' }} />
                                  <span style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>{m.title}</span>
                                </div>
                                <button 
                                  style={{ padding: '0.25rem 0.6rem', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                  onClick={() => {
                                    setNoonImportData({
                                      ...noonImportData,
                                      isDuplicate: true,
                                      existingProductId: m.id,
                                      title: m.title
                                    });
                                    msg(`✅ تم ربط العرض بمنتج: ${m.title}`);
                                  }}
                                >
                                  🔗 ربط بهذا المنتج
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  )}

                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>اسم المنتج</label>
                  <input style={inputStyle} value={noonImportData.title} onChange={e => setNoonImportData({...noonImportData, title: e.target.value})} />
                  
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>الوصف</label>
                  <textarea style={{...inputStyle, resize: 'vertical'}} rows={3} value={noonImportData.description} onChange={e => setNoonImportData({...noonImportData, description: e.target.value})} />
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>السعر الحالي</label>
                      <input style={inputStyle} value={noonImportData.price} onChange={e => setNoonImportData({...noonImportData, price: e.target.value})} placeholder="مثال: 500" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>السعر الأصلي (اختياري)</label>
                      <input style={inputStyle} value={noonImportData.originalPrice} onChange={e => setNoonImportData({...noonImportData, originalPrice: e.target.value})} placeholder="قبل الخصم" />
                    </div>
                  </div>

                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>رابط الصورة الرئيسية</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input style={{...inputStyle, direction: 'ltr', flex: 1}} value={noonImportData.image} onChange={e => setNoonImportData({...noonImportData, image: e.target.value})} />
                    {noonImportData.image && <img src={noonImportData.image} style={{ width: 40, height: 40, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '4px' }} alt="Preview" />}
                  </div>

                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>روابط الصور الإضافية (رابط في كل سطر)</label>
                  <textarea style={{...inputStyle, resize: 'vertical', direction: 'ltr'}} rows={3} value={noonImportData.images ? noonImportData.images.join('\n') : ''} onChange={e => setNoonImportData({...noonImportData, images: e.target.value.split('\n').filter((u:string) => u.trim() !== '')})} />

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>التصنيف</label>
                      
                      {/* AI Suggestion UI */}
                      {(aiLoading || aiSuggestion || aiError) && (
                        <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                          {aiLoading && <div style={{ color: '#64748b' }}>🤖 جاري تحليل المنتج واقتراح فئة بالذكاء الاصطناعي...</div>}
                          {aiSuggestion && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>🤖 الفئة المقترحة: {aiSuggestion.categoryTitle}</span>
                                <span style={{ fontWeight: 600, color: aiSuggestion.confidence >= 70 ? '#16a34a' : '#ea580c' }}>
                                  درجة الثقة: {aiSuggestion.confidence}%
                                </span>
                              </div>
                              {aiSuggestion.confidence >= 70 ? (
                                <button 
                                  style={{ ...btnGhost, padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', marginTop: '0.25rem' }} 
                                  onClick={() => setNoonImportData({...noonImportData, categoryId: aiSuggestion.category})}
                                >
                                  اعتماد الاقتراح
                                </button>
                              ) : (
                                <div style={{ color: '#b45309', fontWeight: 600, marginTop: '0.25rem' }}>⚠️ الثقة منخفضة — يُفضل اختيار الفئة يدويًا</div>
                              )}
                            </div>
                          )}
                          {aiError && <div style={{ color: '#dc2626' }}>🤖 تعذر الحصول على اقتراح ذكي ({aiError}). يرجى الاختيار يدوياً.</div>}
                        </div>
                      )}

                      <select style={inputStyle} value={noonImportData.categoryId} onChange={e => setNoonImportData({...noonImportData, categoryId: e.target.value})}>
                        <option value="">-- اختر الفئة --</option>
                        {categorySections.map(c => <option key={c.id} value={c.category}>{c.title}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>التوفر</label>
                      <select style={inputStyle} value={noonImportData.availability || 'in_stock'} onChange={e => setNoonImportData({...noonImportData, availability: e.target.value})}>
                        <option value="in_stock">متوفر</option>
                        <option value="out_of_stock">غير متوفر</option>
                      </select>
                    </div>
                  </div>

                  <button style={{ ...btnPrimary, width: '100%', marginTop: '1rem' }} onClick={handleNoonSave} disabled={noonScrapeLoading}>
                    {noonScrapeLoading ? 'جاري الحفظ...' : 'حفظ المنتج وإضافة عرض Noon'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Products List & Edit (إدارة المنتجات) ── */}
      {activeTab === 'المنتجات' && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>إدارة المنتجات</h2>
          <div>
            <h3 style={{ margin: '0 0 1rem 0' }}>جميع المنتجات</h3>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <select style={{ ...inputStyle, flex: 1 }} value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setShowProducts(false); }}>
                <option value="All">كل الفئات</option>
                {categorySections.map(c => <option key={c.id} value={c.category}>{c.title}</option>)}
              </select>
              <button style={btnPrimary} onClick={fetchProducts}>عرض المنتجات</button>
            </div>

            {showProducts && !editingProduct && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem' }}>الصورة</th>
                      <th style={{ padding: '0.75rem' }}>العنوان</th>
                      <th style={{ padding: '0.75rem' }}>الفئة</th>
                      <th style={{ padding: '0.75rem' }}>السعر</th>
                      <th style={{ padding: '0.75rem' }}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}><img src={p.image} alt={p.title} style={{ width: 50, height: 50, objectFit: 'contain' }} /></td>
                        <td style={{ padding: '0.75rem', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <select 
                            style={{ padding: '0.25rem', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #cbd5e1', maxWidth: '150px' }}
                            value={p.category || ''}
                            onChange={async (e) => {
                              const newCat = e.target.value;
                              // Optimistic UI update
                              setProducts(products.map(prod => prod.id === p.id ? { ...prod, category: newCat } : prod));
                              // API update
                              try {
                                await fetch(`/api/products/${p.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ category: newCat })
                                });
                              } catch (err) {
                                alert('فشل في تحديث الفئة!');
                              }
                            }}
                          >
                            <option value="">-- غير محدد --</option>
                            {categorySections.map(c => <option key={c.id} value={c.category}>{c.title}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700 }}>{p.price}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}><button style={btnGhost} onClick={() => handleEditClick(p)}>تعديل</button><button style={btnDanger} onClick={() => handleDeleteProduct(p.id)}>حذف</button></div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>لا توجد منتجات.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {editingProduct && (
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0 }}>تعديل المنتج</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={btnPrimary} onClick={handleSaveProduct}>حفظ التعديلات</button>
                    <button style={btnGhost} onClick={() => setEditingProduct(null)}>إلغاء</button>
                  </div>
                </div>

                <CollapsePanel title="بيانات المنتج" icon="📋" defaultOpen>
                  <label style={{ display: 'block', fontWeight: 600 }}>اسم المنتج</label>
                  <input style={{...inputStyle, marginBottom: '0.75rem'}} value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                  
                  <label style={{ display: 'block', fontWeight: 600 }}>الفئة</label>
                  <select style={{...inputStyle, marginBottom: '0.75rem'}} value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})}>
                    {categorySections.map(c => <option key={c.id} value={c.category}>{c.title}</option>)}
                  </select>
                  
                  <label style={{ display: 'block', fontWeight: 600 }}>السعر</label>
                  <input style={{...inputStyle, marginBottom: '0.75rem'}} value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} />
                  
                  <label style={{ display: 'block', fontWeight: 600 }}>الوصف</label>
                  <textarea style={{...inputStyle, marginBottom: '0.75rem'}} rows={3} value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                </CollapsePanel>

                <CollapsePanel title="صور المنتج" icon="🖼️">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600 }}>رابط الصورة الرئيسية الحالية</label>
                      <input style={{...inputStyle, direction: 'ltr', textAlign: 'left', marginBottom: '0'}} value={editData.image || ''} onChange={e => setEditData({...editData, image: e.target.value})} />
                      {editData.image && <img src={editData.image} alt="Preview" style={{ width: 80, height: 80, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 4, marginTop: '0.5rem', backgroundColor: '#fff' }} />}
                    </div>
                    {/* Placeholder for Multi-Image Upload UI */}
                    <div style={{ padding: '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#64748b', background: '#f1f5f9' }}>
                      سيتم إضافة واجهة رفع وتعديل الصور المتعددة (Multi-Image Upload) هنا في المرحلة القادمة.
                    </div>
                  </div>
                </CollapsePanel>

                <CollapsePanel title="عروض المتاجر" icon="🏪">
                  <ProductOffersEditor productId={editData.id} />
                </CollapsePanel>

                <CollapsePanel title="الإعدادات الإضافية" icon="⚙️">
                  <label style={{ display: 'block', fontWeight: 600 }}>الرابط الأصلي (Original URL)</label>
                  <input style={{...inputStyle, marginBottom: '0.75rem', direction: 'ltr', textAlign: 'left'}} value={editData.originalUrl || ''} onChange={e => setEditData({...editData, originalUrl: e.target.value})} />
                </CollapsePanel>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 2. Homepage Sections (أقسام الصفحة الرئيسية) ── */}
      {activeTab === 'التصنيفات' && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>أقسام الصفحة الرئيسية</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {homepageSections.map(sec => (
            <div key={sec.id}>
              {editingSection?.id === sec.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <input style={inputStyle} value={editingSection.title} onChange={e => setEditingSection({ ...editingSection, title: e.target.value })} placeholder="عنوان القسم" />
                  <select style={inputStyle} value={editingSection.type} onChange={e => setEditingSection({ ...editingSection, type: e.target.value })}>
                    {SECTION_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '-0.5rem' }}>{SECTION_TYPES.find(t => t.key === editingSection.type)?.desc}</p>
                  
                  {editingSection.type === 'category_section' && (
                    <select style={inputStyle} value={editingSection.category ?? ''} onChange={e => setEditingSection({ ...editingSection, category: e.target.value })}>
                      <option value="">-- اختر الفئة --</option>
                      {categorySections.map(c => <option key={c.category} value={c.category}>{c.title}</option>)}
                    </select>
                  )}
                  {editingSection.type === 'manual_products' && (
                    <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', maxHeight: '200px', overflowY: 'auto', background: 'white' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>المنتجات المخصصة لهذا القسم (اختياري):</div>
                      {products.length === 0 ? <div style={{ fontSize: '0.85rem', color: '#666' }}>لا توجد منتجات متاحة.</div> : products.map(p => (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={editingSection.productIds?.includes(p.id) || false}
                            onChange={(e) => {
                              const currentIds = editingSection.productIds || [];
                              const newIds = e.target.checked ? [...currentIds, p.id] : currentIds.filter((id: string) => id !== p.id);
                              setEditingSection({ ...editingSection, productIds: newIds });
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}><button style={btnPrimary} onClick={() => saveEditSection(editingSection)}>حفظ</button><button style={btnGhost} onClick={() => setEditingSection(null)}>إلغاء</button></div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700, flex: 1 }}>{sec.title}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({SECTION_TYPES.find(t => t.key === sec.type)?.label})</span>
                  <span style={BADGE(sec.enabled)}>{sec.enabled ? 'مفعّل' : 'معطّل'}</span>
                  <button style={btnGhost} onClick={() => setEditingSection(sec)}>تعديل</button>
                  <button style={{ ...btnGhost, background: sec.enabled ? '#fef9c3' : '#dcfce7' }} onClick={() => toggleSection(sec)}>{sec.enabled ? 'تعطيل' : 'تفعيل'}</button>
                  <button style={btnDanger} onClick={() => deleteSection(sec.id)}>حذف</button>
                </div>
              )}
            </div>
          ))}

          {addingSection ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#f0f9ff', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd' }}>
              <input style={inputStyle} value={newSection.title} onChange={e => setNewSection({ ...newSection, title: e.target.value })} placeholder="عنوان القسم" />
              <select style={inputStyle} value={newSection.type} onChange={e => setNewSection({ ...newSection, type: e.target.value })}>
                {SECTION_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '-0.5rem' }}>{SECTION_TYPES.find(t => t.key === newSection.type)?.desc}</p>
              
              {newSection.type === 'category_section' && (
                <select style={inputStyle} value={newSection.category ?? ''} onChange={e => setNewSection({ ...newSection, category: e.target.value })}>
                  <option value="">-- اختر الفئة --</option>
                  {categorySections.map(c => <option key={c.category} value={c.category}>{c.title}</option>)}
                </select>
              )}
              {newSection.type === 'manual_products' && (
                <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', maxHeight: '200px', overflowY: 'auto', background: 'white' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>المنتجات المخصصة لهذا القسم (اختياري):</div>
                  {products.length === 0 ? <div style={{ fontSize: '0.85rem', color: '#666' }}>لا توجد منتجات متاحة.</div> : products.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newSection.productIds?.includes(p.id) || false}
                        onChange={(e) => {
                          const currentIds = newSection.productIds || [];
                          const newIds = e.target.checked ? [...currentIds, p.id] : currentIds.filter((id: string) => id !== p.id);
                          setNewSection({ ...newSection, productIds: newIds });
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                    </label>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}><button style={btnPrimary} onClick={addSection}>إضافة</button><button style={btnGhost} onClick={() => setAddingSection(false)}>إلغاء</button></div>
            </div>
          ) : (
            <button style={{ ...btnPrimary, alignSelf: 'flex-start' }} onClick={() => setAddingSection(true)}>＋ إضافة فئة أو قسم جديد</button>
          )}
        </div>
        </div>
      )}

      {/* ── Daily Deals (العروض اليومية) ── */}
      {activeTab === 'الرئيسية' && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>العروض اليومية (Daily Deals)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {dailyDeals.map(deal => (
            <div key={deal.id}>
              {editingDeal?.id === deal.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                  <select style={inputStyle} value={editingDeal.productId} onChange={e => setEditingDeal({ ...editingDeal, productId: e.target.value })}>
                    <option value="">-- اختر المنتج --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                  <input style={inputStyle} placeholder="سعر العرض (اختياري، يترك السعر الأصلي إذا كان فارغاً)" value={editingDeal.offerPrice ?? ''} onChange={e => setEditingDeal({ ...editingDeal, offerPrice: e.target.value })} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}><label>تاريخ البدء</label><input type="date" style={inputStyle} value={editingDeal.startDate ?? ''} onChange={e => setEditingDeal({ ...editingDeal, startDate: e.target.value })} /></div>
                    <div style={{ flex: 1 }}><label>تاريخ الانتهاء</label><input type="date" style={inputStyle} value={editingDeal.endDate ?? ''} onChange={e => setEditingDeal({ ...editingDeal, endDate: e.target.value })} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}><button style={btnPrimary} onClick={saveEditDeal}>حفظ</button><button style={btnGhost} onClick={() => setEditingDeal(null)}>إلغاء</button></div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700, flex: 1 }}>{products.find(p => p.id === deal.productId)?.title || 'منتج غير معروف'}</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{deal.offerPrice ? `${deal.offerPrice}` : 'السعر الأصلي'}</span>
                  <span style={BADGE(deal.enabled)}>{deal.enabled ? 'مفعّل' : 'معطّل'}</span>
                  <button style={btnGhost} onClick={() => setEditingDeal(deal)}>تعديل</button>
                  <button style={{ ...btnGhost, background: deal.enabled ? '#fef9c3' : '#dcfce7' }} onClick={() => toggleDeal(deal)}>{deal.enabled ? 'تعطيل' : 'تفعيل'}</button>
                  <button style={btnDanger} onClick={() => deleteDeal(deal.id)}>حذف</button>
                </div>
              )}
            </div>
          ))}

          {addingDeal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#f0f9ff', borderRadius: 'var(--radius-md)' }}>
              <select style={inputStyle} value={newDeal.productId} onChange={e => setNewDeal({ ...newDeal, productId: e.target.value })}>
                <option value="">-- اختر المنتج --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <input style={inputStyle} placeholder="سعر العرض (اختياري)" value={newDeal.offerPrice} onChange={e => setNewDeal({ ...newDeal, offerPrice: e.target.value })} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}><label>تاريخ البدء (اختياري)</label><input type="date" style={inputStyle} value={newDeal.startDate} onChange={e => setNewDeal({ ...newDeal, startDate: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label>تاريخ الانتهاء (اختياري)</label><input type="date" style={inputStyle} value={newDeal.endDate} onChange={e => setNewDeal({ ...newDeal, endDate: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}><button style={btnPrimary} onClick={addDeal}>إضافة</button><button style={btnGhost} onClick={() => setAddingDeal(false)}>إلغاء</button></div>
            </div>
          ) : (
            <button style={{ ...btnPrimary, alignSelf: 'flex-start' }} onClick={() => setAddingDeal(true)}>＋ إضافة عرض يومي</button>
          )}
        </div>
        </div>
      )}

      {/* ── Amazon / Affiliate Settings ── */}
      {activeTab === 'الإعدادات' && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>إعدادات أمازون (Amazon Settings)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>معرف التتبع (Tracking ID / Tag)</label>
            <input style={inputStyle} value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="مثال: my-store-21" dir="ltr" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>معرف بكسل فيسبوك (Facebook Pixel ID)</label>
            <input style={inputStyle} value={facebookPixelId} onChange={e => setFacebookPixelId(e.target.value)} placeholder="مثال: 123456789012345" dir="ltr" />
          </div>
          <button style={{ ...btnPrimary, alignSelf: 'flex-start' }} onClick={saveAmazonSettings}>حفظ الإعدادات</button>
        </div>
        </div>
      )}

      {/* ── Noon Affiliate Settings ── */}
      {activeTab === 'الإعدادات' && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, color: '#854d0e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🛍️</span> إعدادات أفلييت نون (Noon Affiliate Settings)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>معرف تتبع نون (Noon Affiliate Tag)</label>
              <input style={{ ...inputStyle, borderColor: '#fde047' }} value={noonTrackingId} onChange={e => setNoonTrackingId(e.target.value)} placeholder="مثال: AFF72733841fe2f" dir="ltr" />
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>سيتم استخدام هذا الـ Tag تلقائياً عند توليد وتحويل روابط الشراء الخاصة بمتجر Noon.</p>
            </div>
            <button style={{ ...btnPrimary, background: '#ca8a04', alignSelf: 'flex-start' }} onClick={saveNoonSettings}>حفظ إعدادات نون</button>
          </div>
        </div>
      )}

      {/* ── Social Media Links ── */}
      {activeTab === 'الإعدادات' && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>التواصل الاجتماعي (Social Links)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {socialLinks.map((link, i) => (
            <div key={i}>
              {editingLinkIdx === i ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select style={{ ...inputStyle, width: 'auto' }} value={newPlatform} onChange={e => setNewPlatform(e.target.value)}>
                    {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                  <input style={{ ...inputStyle, flex: 1 }} value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." dir="ltr" />
                  <button style={btnPrimary} onClick={saveEditLink}>حفظ</button>
                  <button style={btnGhost} onClick={() => { setEditingLinkIdx(null); setNewUrl(''); }}>إلغاء</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 700, minWidth: '90px' }}>{PLATFORMS.find(p => p.key === link.platform)?.label ?? link.platform}</span>
                  <span style={{ flex: 1, direction: 'ltr' }}>{link.url}</span>
                  <button style={btnGhost} onClick={() => startEditLink(i)}>تعديل</button>
                  <button style={btnDanger} onClick={() => removeSocialLink(i)}>حذف</button>
                </div>
              )}
            </div>
          ))}
          {addingLink ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <select style={{ ...inputStyle, width: 'auto' }} value={newPlatform} onChange={e => setNewPlatform(e.target.value)}>
                {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <input style={{ ...inputStyle, flex: 1 }} value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." dir="ltr" />
              <button style={btnPrimary} onClick={addSocialLink}>إضافة</button>
              <button style={btnGhost} onClick={() => { setAddingLink(false); setNewUrl(''); }}>إلغاء</button>
            </div>
          ) : (
            <button style={{ ...btnPrimary, alignSelf: 'flex-start' }} onClick={() => setAddingLink(true)}>＋ إضافة رابط تواصل اجتماعي</button>
          )}
        </div>
        </div>
      )}

      {/* ── Store Management (المتاجر) ── */}
      {activeTab === 'المتاجر' && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 700 }}>المتاجر المدعومة</h2>
          <p style={{ color: '#475569', marginBottom: '1.5rem' }}>إدارة المتاجر التي يتم عرض المنتجات منها. إضافة متجر نون تتم بشكل يدوي من خلال صفحة المنتج.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            
            <div 
              onClick={() => setActiveTab('الإعدادات')}
              style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center', background: '#f8fafc', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📦</span>
              <strong style={{ fontSize: '1.25rem' }}>Amazon Egypt</strong>
              <div style={{ fontSize: '0.9rem', color: '#166534', marginTop: '0.75rem', fontWeight: 600, flex: 1 }}>استيراد تلقائي مفعّل</div>
              <button style={{ ...btnPrimary, marginTop: '1.5rem', width: '100%', pointerEvents: 'none' }}>⚙️ إعدادات Amazon</button>
            </div>
            
            <div 
              onClick={() => setActiveTab('استيراد المنتجات')}
              style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center', background: '#f8fafc', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🛍️</span>
              <strong style={{ fontSize: '1.25rem' }}>Noon Egypt</strong>
              <div style={{ fontSize: '0.9rem', color: '#0f172a', marginTop: '0.75rem', fontWeight: 600, flex: 1 }}>إضافة عروض يدوية (فقط)</div>
              <button style={{ ...btnPrimary, marginTop: '1.5rem', width: '100%', pointerEvents: 'none' }}>➕ إضافة عرض Noon</button>
            </div>

          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  );
}
