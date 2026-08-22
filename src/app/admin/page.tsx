'use client';
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

// ── types ──────────────────────────────────────────────────────────────
interface SocialLink { platform: string; url: string; }
interface Section { id: string; title: string; type: string; category?: string; productIds?: string[]; enabled: boolean; order: number; }
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

// ── main component ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const msg = (t: string) => { setMessage(t); setTimeout(() => setMessage(''), 3000); };

  // ── Affiliate / Amazon settings ──
  const [trackingId, setTrackingId] = useState('');
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
  const [newCategory, setNewCategory] = useState<Partial<Section>>({ title: '', type: 'products_by_category', enabled: true });
  const [editingCategory, setEditingCategory] = useState<Section | null>(null);

  // ── Categories specifically (computed from sections) ──
  const categorySections = sections.filter(s => s.type === 'products_by_category').sort((a,b) => a.order - b.order);
  const homepageSections = sections.filter(s => s.type !== 'products_by_category').sort((a,b) => a.order - b.order);

  // ── Products ──
  const [urls, setUrls] = useState('');
  const [scrapeCategory, setScrapeCategory] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);

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

  // ── Data Fetching ──
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.trackingId) setTrackingId(d.trackingId);
      if (d.facebookPixelId) setFacebookPixelId(d.facebookPixelId);
      if (d.socialLinks) setSocialLinks(d.socialLinks);
    });
    fetch('/api/sections').then(r => r.json()).then(setSections).catch(() => setSections([]));
    fetch('/api/daily_deals').then(r => r.json()).then(setDailyDeals).catch(() => setDailyDeals([]));
    
    // Fetch products once to be used in dropdowns (Daily Deals, Manual Products, etc)
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => setProducts([]));
  }, []);

  const startEditLink = (i: number) => {
    setEditingLinkIdx(i);
    setNewPlatform(socialLinks[i].platform);
    setNewUrl(socialLinks[i].url);
  };

  // ── Save Settings ──
  const saveSettings = async () => {
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingId, facebookPixelId, socialLinks }),
    });
    msg('✅ تم حفظ الإعدادات بنجاح');
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
  const handleScrape = async () => {
    if (!urls.trim()) return;
    setScrapeLoading(true); setMessage('');
    const urlArray = urls.split('\n').filter(u => u.trim() !== '');
    const targetCategory = scrapeCategory || categorySections[0]?.category || 'General';
    const res = await fetch('/api/scrape', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: urlArray, category: targetCategory }),
    });
    const data = await res.json();
    if (data.success) { msg(`✅ تم سحب وإضافة ${data.count} منتج بنجاح`); setUrls(''); fetchProducts(); }
    else msg(`❌ ${data.error || 'حدث خطأ أثناء السحب'}`);
    setScrapeLoading(false);
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
    const body = { ...newCategory, category: generatedCatId, type: 'products_by_category' };
    const res = await fetch('/api/sections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setSections(s => [...s, data.section]);
      setNewCategory({ title: '', type: 'products_by_category', enabled: true });
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

  return (
    <div style={{ direction: 'rtl', maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ borderBottom: '2px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.75rem' }}>⚙️</span>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>لوحة التحكم</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bkam El-Naharda Admin</p>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: '1.5rem', padding: '0.8rem 1.25rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
          {message}
        </div>
      )}

      {/* ── Products (المنتجات) ── */}
      <CollapsePanel title="المنتجات" icon="🛒" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>استيراد من أمازون</h3>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>روابط المنتجات (رابط في كل سطر)</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', marginBottom: '1rem' }} rows={4} value={urls} onChange={e => setUrls(e.target.value)} placeholder={'https://www.amazon.eg/...\nhttps://www.amazon.eg/...'} dir="ltr" />
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>الفئة (Category)</label>
            <select style={{ ...inputStyle, marginBottom: '1rem' }} value={scrapeCategory} onChange={e => setScrapeCategory(e.target.value)}>
              <option value="">-- اختر الفئة --</option>
              {categorySections.map(c => <option key={c.id} value={c.category}>{c.title}</option>)}
            </select>
            <button style={btnPrimary} onClick={handleScrape} disabled={scrapeLoading}>
              {scrapeLoading ? 'جاري الاستيراد...' : 'استيراد المنتجات'}
            </button>
          </div>

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
                        <td style={{ padding: '0.75rem' }}>{categorySections.find(c => c.category === p.category)?.title || p.category}</td>
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
                <h3 style={{ margin: '0 0 1rem 0' }}>تعديل المنتج</h3>
                <label style={{ display: 'block', fontWeight: 600 }}>اسم المنتج</label><input style={{...inputStyle, marginBottom: '0.75rem'}} value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                <label style={{ display: 'block', fontWeight: 600 }}>الفئة</label>
                <select style={{...inputStyle, marginBottom: '0.75rem'}} value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})}>
                  {categorySections.map(c => <option key={c.id} value={c.category}>{c.title}</option>)}
                </select>
                <label style={{ display: 'block', fontWeight: 600 }}>السعر</label><input style={{...inputStyle, marginBottom: '0.75rem'}} value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} />
                <label style={{ display: 'block', fontWeight: 600 }}>الوصف</label><textarea style={{...inputStyle, marginBottom: '0.75rem'}} rows={3} value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}><button style={btnPrimary} onClick={handleSaveProduct}>حفظ التعديلات</button><button style={btnGhost} onClick={() => setEditingProduct(null)}>إلغاء</button></div>
              </div>
            )}
          </div>
        </div>
      </CollapsePanel>

      {/* ── 1. Categories (إدارة تصنيفات المنتجات) ── */}
      <CollapsePanel title="إدارة تصنيفات المنتجات" icon="🗂️">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {categorySections.map(sec => (
            <div key={sec.id}>
              {editingCategory?.id === sec.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <input style={inputStyle} value={editingCategory.title} onChange={e => setEditingCategory({ ...editingCategory, title: e.target.value })} placeholder="اسم الفئة" />
                  <div style={{ display: 'flex', gap: '0.5rem' }}><button style={btnPrimary} onClick={() => saveEditSection(editingCategory)}>حفظ</button><button style={btnGhost} onClick={() => setEditingCategory(null)}>إلغاء</button></div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700, flex: 1 }}>{sec.title}</span>
                  <span style={BADGE(sec.enabled)}>{sec.enabled ? 'مفعّل' : 'معطّل'}</span>
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
              <div style={{ display: 'flex', gap: '0.5rem' }}><button style={btnPrimary} onClick={addCategory}>إضافة</button><button style={btnGhost} onClick={() => setAddingCategory(false)}>إلغاء</button></div>
            </div>
          ) : (
            <button style={{ ...btnPrimary, alignSelf: 'flex-start' }} onClick={() => setAddingCategory(true)}>＋ إضافة فئة</button>
          )}
        </div>
      </CollapsePanel>

      {/* ── 2. Homepage Sections (أقسام الصفحة الرئيسية) ── */}
      <CollapsePanel title="أقسام الصفحة الرئيسية" icon="🖥️">
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
      </CollapsePanel>

      {/* ── Daily Deals (العروض اليومية) ── */}
      <CollapsePanel title="العروض اليومية (Daily Deals)" icon="⚡">
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
      </CollapsePanel>

      {/* ── Amazon / Affiliate Settings ── */}
      <CollapsePanel title="إعدادات أمازون (Amazon Settings)" icon="🔗">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>معرف التتبع (Tracking ID / Tag)</label>
            <input style={inputStyle} value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="مثال: my-store-21" dir="ltr" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>معرف بكسل فيسبوك (Facebook Pixel ID)</label>
            <input style={inputStyle} value={facebookPixelId} onChange={e => setFacebookPixelId(e.target.value)} placeholder="مثال: 123456789012345" dir="ltr" />
          </div>
          <button style={{ ...btnPrimary, alignSelf: 'flex-start' }} onClick={saveSettings}>حفظ الإعدادات</button>
        </div>
      </CollapsePanel>

      {/* ── Social Media Links ── */}
      <CollapsePanel title="التواصل الاجتماعي (Social Links)" icon="📲">
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
      </CollapsePanel>

    </div>
  );
}
