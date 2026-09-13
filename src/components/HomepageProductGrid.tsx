'use client';

import React, { useState, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/data/db';

interface CategoryObj {
  id: string;
  title: string;
  slug?: string;
}

interface HomepageProductGridProps {
  products: Product[];
  categories: CategoryObj[] | string[];
}

export default function HomepageProductGrid({ products, categories }: HomepageProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('الكل');

  const filteredProducts = useMemo(() => {
    if (!activeCategory || activeCategory === 'all' || activeCategory === 'الكل') {
      return products.slice(0, 40);
    }

    // 1. Find if activeCategory matches a specific category in categories prop
    let matchedCategory: CategoryObj | undefined = undefined;
    if (categories.length > 0 && typeof categories[0] === 'object') {
      matchedCategory = (categories as CategoryObj[]).find(
        (c) => c.title === activeCategory || c.id === activeCategory || c.slug === activeCategory
      );
    }
    const directId = matchedCategory ? matchedCategory.id : activeCategory;

    // 2. Parent-to-children mapping for high-level categories
    const parentMappings: Record<string, string[]> = {
      'الإلكترونيات': ['cat_uzhhuoj5g', 'cat_cameras', 'cat_power', 'cat_phones', 'cat_audio', 'cat_accessories', 'electronics', 'cat_8e59bb87ed5f', 'cat_9a096b3b0220', 'cat_f31c02663e8f', 'cat_92ca49512615', 'cat_c0d9f555671f', 'cat_fe83890f074a', 'cat_ce01ee96fa7e'],
      'المنزل والمطبخ': ['cat_mfufmoad0', 'cat_kitchenapps', 'cat_6d04c5ft6', 'cat_c4tky0yxa', 'cat_kitchentools', 'cat_u310yd1w3', 'cat_2zjelnsdg', 'home-kitchen', 'kitchen', 'cat_aaf0fbe22f26', 'cat_18c2760ea403', 'cat_661052da666a', 'cat_8203ce26b731', 'cat_2a87d8830611', 'cat_b9af786a4c81'],
      'الأزياء والموضة': ['cat_hbxqqz95p', 'cat_hfskvya0h', 'cat_oxh8hivt8', 'cat_5kv8y47df', 'cat_travelcross', 'cat_backpacks', 'cat_62fdle3jq', 'fashion', 'cat_1d947e87df67', 'cat_aca079665732', 'cat_bd52801767a6', 'cat_f19dea3af584', 'cat_9964d496c474', 'cat_539a8cf03644', 'cat_c4163a986941'],
      'الصحة والجمال': ['cat_g3n6vkljv', 'cat_ut73yprlm', 'cat_bwoqca3kt', 'cat_o6r080tvi', 'cat_perfumes', 'cat_personalcare', 'cat_r826y1abx', 'health-beauty', 'cat_220d47ded76f', 'cat_5dc049f1d926', 'cat_756a54bd3bfb', 'cat_1fcbcb0752d8', 'cat_a04a69506302'],
      'مستلزمات السيارات': ['cat_dvuxkdjve', 'cat_a6s6tp65d', 'cat_ifs67ovt2', 'cat_revsrdm4z', 'automotive', 'cat_f42f7614e6c7', 'cat_06eab94f721e', 'cat_f52b23e7c904', 'cat_dc0a18738cc2'],
      'الرياضة واللياقة': ['cat_gnkssf8aq', 'cat_pqw2g6ac9', 'cat_ouk0kv2k7', 'cat_jiacjmtx3', 'sports', 'cat_3b7043e05588', 'cat_d67c0c44365c', 'cat_1048bbaea21f', 'cat_5fbc4caa8066'],
      'المنتجات المكتبية': ['cat_dby0c7bhh', 'cat_bbam1301v', 'cat_9pyqkxiit', 'cat_fmbmubvnt', 'office', 'cat_931e8eca0a03', 'cat_762df1d7e159', 'cat_16f3529b0382'],
      'ماي واي': ['cat_mtnxvq39', 'my-way', 'myway', 'cat_0896edaf0787', 'cat_f41dabc050ee', 'cat_dda64458e9b4'],
      'أدوات ومستلزمات الطوارئ والسلامة': ['cat_955651762abe', 'cat_f5ce2751edd9', 'cat_7f1c86a7a904', 'cat_7920da68dbe4'],
      'ألعاب وأنشطة الأطفال': ['cat_ef1c5d3a569c', 'cat_8bf5aa31c8c5'],
      
      // Explicit Subcategories Mappings
      'موبايلات': ['cat_phones', 'phones', 'موبايلات'],
      'الموبايلات': ['cat_phones', 'phones', 'موبايلات'],
      'شواحن وباور بانك': ['cat_power', 'power'],
      'كاميرات مراقبة': ['cat_cameras', 'cameras'],
      'أدوات المطبخ والطبخ': ['cat_6d04c5ft6', 'kitchentools'],
      'الأجهزة المنزلية': ['cat_c4tky0yxa', 'kitchenapps'],
      'العطور': ['cat_o6r080tvi', 'cat_perfumes', 'perfumes'],
      'ملابس رجالية': ['cat_hfskvya0h'],
      'ملابس نسائية': ['cat_oxh8hivt8'],
      'شنط سفر وكروس': ['cat_travelcross']
    };

    const allowedIds = parentMappings[activeCategory] || [directId, activeCategory];

    return products.filter((p: any) => {
      const prodCat = String(p.category || p.categoryId || p.category_id || '').trim();
      
      // Direct or mapped match
      if (allowedIds.some((id) => id.toLowerCase() === prodCat.toLowerCase())) return true;
      if (p.category === activeCategory || p.title?.includes(activeCategory)) return true;
      
      return false;
    }).slice(0, 40);
  }, [products, activeCategory, categories]);

  return (
    <section className="section" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 className="text-2xl" style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
          تصفح أفضل العروض
        </h2>
      </div>

      {/* Interactive Category Chips */}
      <div className="filter-chips-container" dir="rtl">
        <style dangerouslySetInnerHTML={{__html: `
          .filter-chips-container {
            display: flex;
            gap: 0.75rem;
            overflow-x: auto;
            padding-bottom: 1rem;
            margin-bottom: 1rem;
            scrollbar-width: none; /* Firefox */
          }
          .filter-chips-container::-webkit-scrollbar {
            display: none; /* Safari and Chrome */
          }
          .filter-chip {
            white-space: nowrap;
            padding: 0.5rem 1.25rem;
            border-radius: 999px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            border: 2px solid #e2e8f0;
            background: #ffffff;
            color: #64748b;
            transition: all 0.2s ease;
          }
          .filter-chip:hover {
            border-color: #cbd5e1;
            background: #f8fafc;
          }
          .filter-chip.active {
            background: #1e1b4b;
            border-color: #1e1b4b;
            color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(30, 27, 75, 0.2);
          }
          
          .interactive-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.25rem;
          }
          @media (max-width: 1024px) {
            .interactive-grid { grid-template-columns: repeat(3, 1fr); }
          }
          @media (max-width: 768px) {
            .interactive-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          }
          @media (max-width: 480px) {
            .interactive-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          }
        `}} />
        
        <button 
          className={`filter-chip ${activeCategory === 'الكل' ? 'active' : ''}`}
          onClick={() => setActiveCategory('الكل')}
        >
          الكل
        </button>
        {categories.map(cat => {
          const catTitle = typeof cat === 'string' ? cat : cat.title;
          const catKey = typeof cat === 'string' ? cat : (cat.id || cat.title);
          return (
            <button 
              key={catKey}
              className={`filter-chip ${activeCategory === catTitle ? 'active' : ''}`}
              onClick={() => setActiveCategory(catTitle)}
            >
              {catTitle}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      <div className="interactive-grid">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          لا توجد منتجات متاحة في هذا القسم حالياً.
        </div>
      )}
    </section>
  );
}
