require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runAudit() {
  console.log('Fetching sections...');
  const { data: sections, error: secErr } = await supabase.from('sections').select('*');
  if (secErr) throw secErr;

  console.log('Fetching products...');
  const { data: products, error: prodErr } = await supabase.from('products').select('*');
  if (prodErr) throw prodErr;

  const sectionMap = {};
  sections.forEach(s => {
    const catId = s.category || s.id;
    sectionMap[catId] = {
      id: s.id,
      catId: catId,
      title: s.title,
      type: s.type
    };
  });

  // Hardcoded fallback map to resolve legacy IDs that were deleted from sections table
  const fallbackMappings = {
    'الإلكترونيات والتكنولوجيا': ['cat_uzhhuoj5g', 'cat_cameras', 'cat_power', 'cat_phones', 'cat_audio', 'cat_accessories', 'electronics'],
    'المنزل والمطبخ': ['cat_mfufmoad0', 'cat_kitchenapps', 'cat_6d04c5ft6', 'cat_c4tky0yxa', 'cat_kitchentools', 'cat_u310yd1w3', 'cat_2zjelnsdg', 'home-kitchen', 'kitchen'],
    'الأزياء والملابس': ['cat_hbxqqz95p', 'cat_hfskvya0h', 'cat_oxh8hivt8', 'cat_5kv8y47df', 'cat_travelcross', 'cat_backpacks', 'cat_62fdle3jq', 'fashion'],
    'الصحة والجمال': ['cat_g3n6vkljv', 'cat_ut73yprlm', 'cat_bwoqca3kt', 'cat_o6r080tvi', 'cat_perfumes', 'cat_personalcare', 'cat_r826y1abx', 'health-beauty'],
    'مستلزمات واكسسوارات السيارات': ['cat_dvuxkdjve', 'cat_a6s6tp65d', 'cat_ifs67ovt2', 'cat_revsrdm4z', 'automotive'],
    'الرياضة واللياقة البدنية': ['cat_gnkssf8aq', 'cat_pqw2g6ac9', 'cat_ouk0kv2k7', 'cat_jiacjmtx3', 'sports'],
    'المنتجات المكتبية ومستلزمات المدارس': ['cat_dby0c7bhh', 'cat_bbam1301v', 'cat_9pyqkxiit', 'cat_fmbmubvnt', 'office'],
    'ماي واي': ['cat_mtnxvq39', 'my-way', 'myway'],
    'ألعاب وأنشطة الأطفال': ['cat_fj0r4ax73', 'cat_nsexgbpk6']
  };

  // Populate sectionMap with fallbacks if missing
  Object.keys(fallbackMappings).forEach(catName => {
    fallbackMappings[catName].forEach(oldId => {
      if (!sectionMap[oldId]) {
        sectionMap[oldId] = {
          id: oldId,
          catId: oldId,
          title: catName,
          type: 'products_by_category'
        };
      }
    });
  });

  const results = {
    totalProducts: products.length,
    totalSections: sections.length,
    A_Correct: 0,
    B_ProbablyCorrect: 0,
    C_Suspicious: 0,
    D_ClearlyWrong: 0,
    NoCategory: 0,
    CategoryNotFound: 0,
    issues: [],
    myWayIssues: [],
    categoryProblemCounts: {}
  };

  // Keywords that usually define a category
  const keywords = {
    'موبايلات': ['موبايل', 'هاتف', 'سامسونج', 'ايفون', 'شاومي', 'ريلمي', 'اوبو'],
    'شواحن وباور بانك': ['شاحن', 'باور بانك', 'كابل', 'بطارية', 'usb', 'type c', 'محول'],
    'كاميرات مراقبة': ['كاميرا', 'مراقبة', 'dvr', 'nvr', 'عدسة', 'رؤية ليلية'],
    'أدوات المطبخ والطبخ': ['حلة', 'طقم', 'مطبخ', 'معلقة', 'سكينة', 'طبق', 'صينية', 'شواية', 'قلاية'],
    'الأجهزة المنزلية': ['خلاط', 'مكواة', 'مكنسة', 'غسالة', 'ثلاجة', 'مروحة', 'تكييف', 'فرن', 'عجان', 'كبة'],
    'ملابس رجالية': ['تيشيرت', 'قميص', 'بنطلون', 'شورت', 'جاكيت', 'سويت شيرت', 'رجالي'],
    'ملابس نسائية': ['بلوزة', 'فستان', 'جيبة', 'عباية', 'لانجري', 'حريمي', 'نسائي'],
    'شنط سفر وكروس': ['شنطة', 'حقيبة', 'سفر', 'ظهر', 'كروس', 'محفظة'],
    'العطور': ['عطر', 'برفان', 'او دي', 'تواليت', 'بارفان', 'رائحة'],
    'مستلزمات السيارات': ['سيارة', 'حامل موبايل', 'منظف', 'دواسات', 'ميدالية', 'غطاء سيارة'],
    'الرياضة واللياقة': ['سجادة تمارين', 'دمبل', 'مشد', 'قفازات', 'جيم', 'يوغا', 'حبل قفز', 'مكمل'],
    'المنتجات المكتبية': ['مكتب', 'قلم', 'ورق', 'منظم', 'دباسة', 'ملف', 'نوت بوك'],
    'العناية الشخصية': ['ماكينة حلاقة', 'شامبو', 'بلسم', 'كريم', 'لوشن', 'فرشاة', 'سيروم', 'مزيل عرق', 'صابون', 'غسول', 'معجون'],
    'الكمبيوتر': ['لابتوب', 'ماوس', 'كيبورد', 'شاشة', 'طابعة', 'هارد', 'فلاشة', 'راوتر', 'كمبيوتر'],
    'ماي واي': ['ماي واي', 'my way', 'myway', 'برفان ماي واي', 'منظف ماي واي', 'شامبو ماي واي', 'كلين', 'اللهلوبة'],
  };

  const myWayNonKeywords = ['فلتر', 'مياه', 'شاحن', 'باور بانك', 'كابل', 'موبايل', 'سماعة', 'شاشة', 'تلفزيون', 'مطبخ', 'قطن', 'ملابس', 'حذاء'];

  products.forEach(p => {
    const title = (p.title || '').toLowerCase();
    const catId = p.category;
    
    if (!catId) {
      results.NoCategory++;
      return;
    }

    const sec = sectionMap[catId];
    if (!sec) {
      results.CategoryNotFound++;
      results.issues.push({
        id: p.id,
        title: p.title,
        currentCategory: 'UNKNOWN',
        currentCategoryId: catId,
        suggested: 'N/A',
        classification: 'D',
        confidence: 100,
        reason: `Category ID ${catId} not found in sections`
      });
      results.D_ClearlyWrong++;
      return;
    }

    const secTitle = sec.title;
    let classification = 'A';
    let suggested = secTitle;
    let confidence = 100;
    let reason = 'Appears correct based on keywords';

    // Check My Way explicitly
    if (secTitle.includes('ماي واي') || secTitle.toLowerCase().includes('my way')) {
      // If it contains tech/hardware words, it's definitively wrong
      const hasTechWords = myWayNonKeywords.some(w => title.includes(w));
      const hasMyWayWords = keywords['ماي واي'].some(w => title.includes(w));
      
      if (hasTechWords && !hasMyWayWords) {
        classification = 'D';
        confidence = 95;
        reason = 'Contains tech/appliance words but is in My Way category';
        
        // guess category
        if (title.includes('فلتر') || title.includes('مياه')) suggested = 'الأجهزة المنزلية';
        else if (title.includes('شاحن') || title.includes('باور بانك')) suggested = 'شواحن وباور بانك';
        else if (title.includes('موبايل')) suggested = 'موبايلات';
        
        results.myWayIssues.push({
          id: p.id, title: p.title, currentCategory: secTitle, currentCategoryId: catId,
          suggested, classification, confidence, reason
        });
      } else if (!hasMyWayWords) {
        classification = 'C';
        confidence = 60;
        reason = 'Does not contain My Way brand keywords';
        results.myWayIssues.push({
          id: p.id, title: p.title, currentCategory: secTitle, currentCategoryId: catId,
          suggested: 'Unknown', classification, confidence, reason
        });
      }
    } else {
      // General heuristic for other categories
      const targetKeywords = keywords[secTitle] || [];
      const hasTargetKeyword = targetKeywords.length === 0 || targetKeywords.some(w => title.includes(w));
      
      let bestOtherCat = null;
      let maxMatches = 0;
      
      Object.keys(keywords).forEach(cat => {
        if (cat === secTitle) return;
        let matches = keywords[cat].filter(w => title.includes(w)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestOtherCat = cat;
        }
      });

      if (!hasTargetKeyword && maxMatches > 0) {
        classification = maxMatches > 1 ? 'D' : 'C';
        confidence = maxMatches > 1 ? 90 : 70;
        suggested = bestOtherCat;
        reason = `Matches keywords for '${bestOtherCat}' but not for '${secTitle}'`;
      } else if (!hasTargetKeyword) {
        classification = 'B'; // No strong signal either way
        reason = 'No explicit category keywords found, might be correct';
      }
    }

    if (classification === 'A') results.A_Correct++;
    if (classification === 'B') results.B_ProbablyCorrect++;
    
    if (classification === 'C' || classification === 'D') {
      if (classification === 'C') results.C_Suspicious++;
      if (classification === 'D') results.D_ClearlyWrong++;
      
      // We already pushed My Way issues, don't duplicate
      if (!secTitle.includes('ماي واي')) {
        results.issues.push({
          id: p.id,
          title: p.title,
          currentCategory: secTitle,
          currentCategoryId: catId,
          suggested,
          classification,
          confidence,
          reason
        });
      }
      
      results.categoryProblemCounts[secTitle] = (results.categoryProblemCounts[secTitle] || 0) + 1;
    }
  });

  fs.writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
  console.log('Audit complete. Results written to audit_results.json');
}

runAudit().catch(console.error);
