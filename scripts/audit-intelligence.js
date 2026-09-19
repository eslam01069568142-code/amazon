require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runAudit() {
  console.log('Fetching database tables...');
  const [
    { data: products },
    { data: sections },
    { data: stores },
    { data: productOffers }
  ] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('sections').select('*'),
    supabase.from('stores').select('*'),
    supabase.from('product_offers').select('*')
  ]);

  console.log(`Fetched ${products?.length} products, ${sections?.length} sections, ${stores?.length} stores, ${productOffers?.length} offers.`);

  const report = {
    totalProducts: products?.length || 0,
    totalSections: sections?.length || 0,
    classification: { A: 0, B: 0, C: 0, D: 0, E: 0 },
    topProductsToReview: [],
    wrongProducts: [],
    suspiciousProducts: [],
    orphans: [],
    categories: {},
    duplicateCategories: [],
    emptyCategories: [],
    unrelatedProductsInCategories: {},
    brandVsCategory: [],
    frontendHardcoded: []
  };

  // Build section maps
  const sectionMap = {};
  const sectionTitleMap = {};
  
  (sections || []).forEach(s => {
    const cid = s.category || s.id;
    sectionMap[cid] = s;
    if (!sectionTitleMap[s.title]) sectionTitleMap[s.title] = [];
    sectionTitleMap[s.title].push(cid);
  });

  // Identify duplicate categories (same title, different ID)
  for (const [title, ids] of Object.entries(sectionTitleMap)) {
    if (ids.length > 1) {
      report.duplicateCategories.push({ title, ids });
    }
  }

  // Hardcoded known mapping from Frontend
  const frontendMappings = {
    'الإلكترونيات والتكنولوجيا': ['cat_uzhhuoj5g', 'cat_cameras', 'cat_power', 'cat_phones', 'cat_audio', 'cat_accessories', 'electronics', 'cat_aaf0fbe22f26'], // wait, aaf0f is kitchen usually, let's just use known frontend logic
    'المنزل والمطبخ': ['cat_mfufmoad0', 'cat_kitchenapps', 'cat_6d04c5ft6', 'cat_c4tky0yxa', 'cat_kitchentools', 'cat_u310yd1w3', 'cat_2zjelnsdg', 'home-kitchen', 'kitchen', 'cat_9171ea6beb76', 'cat_aaf0fbe22f26', 'cat_18c2760ea403', 'cat_661052da666a', 'cat_8203ce26b731'],
    'الأزياء والملابس': ['cat_hbxqqz95p', 'cat_hfskvya0h', 'cat_oxh8hivt8', 'cat_5kv8y47df', 'cat_travelcross', 'cat_backpacks', 'cat_62fdle3jq', 'fashion'],
    'الصحة والجمال': ['cat_g3n6vkljv', 'cat_ut73yprlm', 'cat_bwoqca3kt', 'cat_o6r080tvi', 'cat_perfumes', 'cat_personalcare', 'cat_r826y1abx', 'health-beauty'],
    'السيارات': ['cat_dvuxkdjve', 'cat_a6s6tp65d', 'cat_ifs67ovt2', 'cat_revsrdm4z', 'automotive'],
    'الرياضة': ['cat_gnkssf8aq', 'cat_pqw2g6ac9', 'cat_ouk0kv2k7', 'cat_jiacjmtx3', 'sports'],
    'مكتبية': ['cat_dby0c7bhh', 'cat_bbam1301v', 'cat_9pyqkxiit', 'cat_fmbmubvnt', 'office'],
    'ماي واي': ['cat_mtnxvq39', 'my-way', 'myway'],
    'أطفال': ['cat_fj0r4ax73', 'cat_nsexgbpk6']
  };

  // Build a reverse mapping from any ID to a "Broad Family"
  const idToFamily = {};
  for (const [family, ids] of Object.entries(frontendMappings)) {
    ids.forEach(id => { idToFamily[id] = family; });
  }

  // Keywords defining product types/families
  const familyKeywords = {
    'الإلكترونيات والتكنولوجيا': ['شاحن', 'باور بانك', 'موبايل', 'لابتوب', 'شاشة', 'تلفزيون', 'كاميرا', 'سماعة', 'كابل', 'usb', 'ساعة ذكية', 'راوتر'],
    'المنزل والمطبخ': ['خلاط', 'مطبخ', 'فلتر', 'مياه', 'مكواة', 'ثلاجة', 'عجان', 'حلة', 'طقم', 'ديكور', 'سرير', 'ملاية', 'منظم', 'صلصال'],
    'الأزياء والملابس': ['تيشيرت', 'قميص', 'بنطلون', 'شورت', 'فستان', 'جيبة', 'حذاء', 'شنطة', 'حقيبة', 'ملابس'],
    'الصحة والجمال': ['عطر', 'برفان', 'شامبو', 'بلسم', 'كريم', 'لوشن', 'مكياج', 'فرشاة', 'مزيل عرق', 'ماكينة حلاقة', 'صابون', 'غسول'],
    'السيارات': ['سيارة', 'دواسة', 'منظف سيارة', 'غطاء', 'ميدالية'],
    'الرياضة': ['رياضة', 'جيم', 'دمبل', 'مشد', 'يوجا', 'تخسيس'],
    'مكتبية': ['مكتب', 'قلم', 'ورق', 'دباسة', 'نوت بوك'],
    'ألعاب وأطفال': ['لعبة', 'أطفال', 'عروسة', 'صلصال', 'بيبي']
  };

  const brandKeywords = {
    'My Way': ['ماي واي', 'my way', 'myway', 'كلين', 'اللهلوبة', 'بينك شيفون', 'فوج'],
    'Apple': ['ابل', 'أبل', 'apple', 'ايفون', 'آيفون', 'ايربودز'],
    'Samsung': ['سامسونج', 'samsung'],
    'Anker': ['انكر', 'anker'],
    'Dice': ['دايس', 'dice'],
  };

  (products || []).forEach(p => {
    const title = (p.title || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const catId = p.category;
    
    // Status initialization
    let status = 'A';
    let suggestedCat = null;
    let confidence = 0;
    let reason = '';

    if (!catId) {
      status = 'E';
      reason = 'No category assigned (NULL or empty).';
      report.orphans.push({ id: p.id, title: p.title, current: 'NONE', reason });
    } else {
      const sec = sectionMap[catId];
      const family = idToFamily[catId] || (sec ? sec.title : 'Unknown');
      
      if (!sec && !idToFamily[catId]) {
        status = 'E';
        reason = `Category ID ${catId} not found in DB or frontend mappings.`;
        report.orphans.push({ id: p.id, title: p.title, current: catId, reason });
      } else {
        // Detect actual family based on title/desc
        let detectedFamily = null;
        let maxScore = 0;

        for (const [fam, kws] of Object.entries(familyKeywords)) {
          let score = 0;
          kws.forEach(kw => {
            if (title.includes(kw)) score += 2;
            if (desc.includes(kw)) score += 1;
          });
          if (score > maxScore) {
            maxScore = score;
            detectedFamily = fam;
          }
        }

        // Detect Brand
        let detectedBrand = null;
        for (const [brand, kws] of Object.entries(brandKeywords)) {
          if (kws.some(kw => title.includes(kw) || desc.includes(kw))) {
            detectedBrand = brand;
            break;
          }
        }

        // Evaluate My Way specific issue
        if (family === 'ماي واي' || (sec && sec.title.includes('ماي واي'))) {
          // If in My Way, but contains electronics or kitchen words
          if (detectedFamily && detectedFamily !== 'الصحة والجمال' && detectedFamily !== 'المنزل والمطبخ') { // My Way makes beauty and some home cleaning
            if (['الإلكترونيات والتكنولوجيا', 'السيارات', 'مكتبية'].includes(detectedFamily)) {
              status = 'D';
              confidence = 99;
              suggestedCat = detectedFamily;
              reason = `Product contains ${detectedFamily} keywords but is in My Way category. My Way does not make these products.`;
            }
          }
          
          if (status !== 'D' && detectedBrand !== 'My Way') {
            status = 'C';
            confidence = 70;
            suggestedCat = detectedFamily || 'Unknown';
            reason = 'In My Way category but lacks explicit My Way brand keywords. Could be a blind import.';
          }
        } else if (detectedFamily && detectedFamily !== family) {
           // E.g. Power bank in kitchen
           status = 'D';
           confidence = 90;
           suggestedCat = detectedFamily;
           reason = `Belongs to '${detectedFamily}' family but is currently placed in '${family}'.`;
        } else if (!detectedFamily) {
           status = 'B';
           reason = 'Probably correct, but no strong keywords detected.';
        }

        // Save classification
        const result = {
          id: p.id,
          title: p.title,
          currentCategory: sec ? sec.title : family,
          currentCategoryId: catId,
          suggestedCategory: suggestedCat,
          brand: detectedBrand || 'Unknown',
          status,
          confidence,
          reason
        };

        if (status === 'D' || status === 'E') {
          report.wrongProducts.push(result);
          report.topProductsToReview.push(result);
        } else if (status === 'C') {
          report.suspiciousProducts.push(result);
          if (report.topProductsToReview.length < 50) report.topProductsToReview.push(result);
        }

        // Unrelated products in categories map
        const catName = sec ? sec.title : family;
        if (!report.unrelatedProductsInCategories[catName]) {
           report.unrelatedProductsInCategories[catName] = { total: 0, wrong: 0, suspicious: 0 };
        }
        report.unrelatedProductsInCategories[catName].total++;
        if (status === 'D') report.unrelatedProductsInCategories[catName].wrong++;
        if (status === 'C') report.unrelatedProductsInCategories[catName].suspicious++;
      }
    }
    report.classification[status]++;
  });

  // Sort and limit Top 50
  report.topProductsToReview.sort((a, b) => b.confidence - a.confidence);
  report.topProductsToReview = report.topProductsToReview.slice(0, 50);

  fs.writeFileSync('audit_intelligence_results.json', JSON.stringify(report, null, 2));
  console.log('Audit complete. Results saved to audit_intelligence_results.json');
}

runAudit().catch(console.error);
