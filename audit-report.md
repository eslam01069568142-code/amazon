# MASTER READ-ONLY CATALOG & CATEGORY AUDIT

## 1. Current Architecture
نظام الـ Taxonomy في مشروع Bkam Elnaharda يعتمد حالياً على بنية مرنة داخل قاعدة البيانات (Supabase) تُخزن في جدول `sections`.
- **Categories vs Sections**: لا يوجد جدول منفصل يسمى `categories`. يتم تعريف جميع الفئات (Categories) كـ `sections` من النوع `products_by_category`.
- **Parent/Child Hierarchy**: يتم تطبيق الهيكلية (Hierarchy) عن طريق الحقل `parent_id`. إذا كان الحقل `null`، يُعتبر القسم Main Category. إذا كان يحتوي على قيمة، يُعتبر Subcategory ويشير إلى `category` الخاص بالأب.
- **Product Relationship**: كل `product` يحتوي على حقل `category` (نصي) يخزن الـ ID الخاص بالـ Subcategory أو الـ Main Category الذي ينتمي إليه.
- **Header**: يقوم `Header.tsx` بجلب الأقسام التي تملك `enabled: true` و `category != null` ثم يبني شجرة الفئات برمجياً باستخدام `parent_id`.
- **Admin**: واجهة لوحة التحكم تقوم بقراءة `sections` وعرض قائمة منسدلة لكل منتج لتعديل الـ `category` يدوياً (ميزة تمت إضافتها مؤخراً).

## 2. Current Taxonomy Tree
بناءً على قراءة البيانات الفعلية الحالية (READ-ONLY) من قاعدة البيانات، إليك الشجرة الحالية:

```text
الصحة والجمال (cat_1sf1jpbjc) [مكرر / مُعطل]
أزياء وملابس (cat_hbxqqz95p)
  ├── ملابس رجالية (cat_hfskvya0h) - 10 Products
  ├── ملابس نسائية (cat_oxh8hivt8) - 3 Products
  ├── الأحذية (cat_5kv8y47df) - 0 Products
  ├── الحقائب والشنط (cat_62fdle3jq) - 0 Products
المنزل والمطبخ (cat_mfufmoad0)
  ├── أدوات المطبخ والطبخ (cat_6d04c5ft6) - 2 Products
  ├── ديكور ومفروشات (cat_2zjelnsdg) - 0 Products
  ├── تنظيم وتخزين (cat_u310yd1w3) - 0 Products
  ├── الأجهزة المنزلية (cat_c4tky0yxa) - 0 Products
  ├── أجهزة المطبخ والمنزل (cat_kitchenapps) - 5 Products
  ├── أدوات ومستلزمات (cat_kitchentools) - 3 Products
الصحة والجمال (cat_g3n6vkljv)
  ├── العناية بالبشرة والجسم (cat_ut73yprlm) - 0 Products
  ├── العناية بالشعر (cat_bwoqca3kt) - 0 Products
  ├── العطور (cat_o6r080tvi) - 0 Products
  ├── أجهزة العناية الشخصية (cat_r826y1abx) - 0 Products
  ├── عطور (cat_perfumes) - 6 Products
  ├── عناية شخصية (cat_personalcare) - 2 Products
الإلكترونيات (cat_uzhhuoj5g)
  ├── موبايلات (cat_phones) - 2 Products
  ├── الصوتيات (cat_audio) - 3 Products
  ├── كاميرات مراقبة (cat_cameras) - 8 Products
  ├── شواحن وباور بانك (cat_power) - 6 Products
  ├── ملحقات وأجهزة (cat_accessories) - 3 Products
الرياضة واللياقة (cat_gnkssf8aq)
  ├── أجهزة رياضية (cat_pqw2g6ac9) - 0 Products
  ├── ملابس رياضية (cat_ouk0kv2k7) - 0 Products
  ├── مستلزمات الأنشطة الخارجية (cat_jiacjmtx3) - 1 Product
الألعاب والترفيه (cat_fj0r4ax73)
  ├── ألعاب لوحية وترفيهية (cat_1yaiyvtqx) - 0 Products
  ├── ألعاب إلكترونية (cat_nsexgbpk6) - 0 Products
  ├── ألعاب أطفال ودمى (cat_6k6saayuh) - 2 Products
  ├── ألعاب تعليمية (cat_i1z201np5) - 0 Products
المنتجات المكتبية (cat_dby0c7bhh)
  ├── أقلام حبر جاف عصا (cat_bbam1301v) - 0 Products
  ├── أدوات مكتبية ومدرسية (cat_9pyqkxiit) - 0 Products
  ├── طابعات وملحقاتها (cat_fmbmubvnt) - 0 Products
مستلزمات السيارات (cat_dvuxkdjve)
  ├── إكسسوارات السيارات (cat_ifs67ovt2) - 0 Products
  ├── إلكترونيات السيارات (cat_a6s6tp65d) - 3 Products
  ├── العناية بالسيارة (cat_revsrdm4z) - 0 Products
  ├── أدوات ومستلزمات الطوارئ (cat_ojyzzps0s) - 0 Products
غير مصنف (cat_kbp8na6k6) - 0 Products
```

## 3. Category Statistics
- **إجمالي المنتجات:** 62 منتج
- **أقسام غير مستخدمة (فارغة تماماً):** المنتجات المكتبية، غير مصنف.
- **إجمالي الأقسام الفرعية (Subcategories):** 36
- **الأقسام الفرعية الفارغة:** 21

## 4. Correct Products
- **المنتجات المصنفة بشكل صحيح تماماً:** ~58 منتج (بنسبة دقة 93%). 
مؤخراً تم إجراء إصلاحات عميقة للمنتجات مثل (Jump Starter, Ice Box, Toys, Clothing) والتي أصبحت جميعها في أقسامها الصحيحة.

## 5. Wrong Subcategory
توجد بعض المنتجات في Subcategory خاطئ ضمن الـ Main Category الصحيح:

| Product | Current | Suggested | Confidence | Reason |
|---------|---------|-----------|------------|--------|
| ريدمي 15C الذكي 8 + 256 جيجا... شاحن | `cat_power` (شواحن) | `cat_phones` (موبايلات) | HIGH (95%) | يحتوي العنوان على "شاحن" فتم وضعه في الشواحن، لكنه موبايل ذكي. |
| ميكروفون لاسلكي... لتسجيل الكاميرا | `cat_power` (شواحن) | `cat_audio` (صوتيات) | HIGH (95%) | يحتوي على "قابلة لإعادة الشحن" فصُنف شواحن، لكنه ميكروفون. |

## 6. Wrong Main Category
| Product | Current | Suggested | Confidence | Reason |
|---------|---------|-----------|------------|--------|
| شنطة سفر دفل قابلة للطي... وصالة الالعاب الرياضية | `cat_6k6saayuh` (ألعاب أطفال) | `cat_62fdle3jq` (حقائب) | HIGH (99%) | صُنف كألعاب لوجود كلمة "الالعاب" في الوصف (صالة الألعاب الرياضية). |

## 7. Uncategorized Products
- **العدد:** 0
- لا يوجد أي منتج بدون قيمة `category` في قاعدة البيانات.

## 8. Ambiguous Products
| Product | Current | Suggested | Confidence | Reason |
|---------|---------|-----------|------------|--------|
| ماكينة حلاقة كهربائية V-290 من في جي ار | `cat_personalcare` | `cat_r826y1abx` (أجهزة العناية) | MEDIUM (80%) | هل نضع الماكينات تحت أجهزة العناية الشخصية أم عناية شخصية عامة؟ يوجد تداخل في الأقسام. |

## 9. Duplicate Categories
- `الصحة والجمال`: يوجد سجل باسم `__DUPLICATE__ الصحة والجمال` يحمل الـ ID (`cat_1sf1jpbjc`)، وسجل آخر نشط `الصحة والجمال` (`cat_g3n6vkljv`).
- توجد أقسام متكررة المعنى في "المنزل والمطبخ":
  - `أدوات المطبخ والطبخ` مقابل `أدوات ومستلزمات`
  - `الأجهزة المنزلية` مقابل `أجهزة المطبخ والمنزل`
- أقسام متكررة في "الصحة والجمال":
  - `العطور` مقابل `عطور`
  - `أجهزة العناية الشخصية` مقابل `عناية شخصية`

## 10. Empty Categories
العديد من الـ Subcategories الموروثة (Hardcoded) فارغة لأن السكريبتات الآلية أنشأت أقساماً جديدة (مثل `cat_kitchentools` و `cat_kitchenapps` بدل استخدام القديمة).
- الأحذية, الحقائب والشنط
- ديكور ومفروشات, تنظيم وتخزين, الأجهزة المنزلية
- العناية بالبشرة والجسم, العناية بالشعر, أجهزة العناية الشخصية
- أجهزة رياضية, ملابس رياضية
- ألعاب لوحية, ألعاب إلكترونية, ألعاب تعليمية
- جميع الفئات المكتبية (أقلام, طابعات)
- إكسسوارات السيارات, العناية بالسيارة, الطوارئ

## 11. Orphan Categories
- **العدد:** 0
- تم التحقق من قاعدة البيانات. لا يوجد أي `parent_id` يشير إلى قسم محذوف أو غير موجود.

## 12. Conflicting Classification Rules
**مشكلة هيكلية:** المشروع يحتوي على **11 سكريبت** مختلف للتصنيف.
1. `organize-all-categories.js`
2. `master-clean-categories.js`
3. `deep-fix-categories.js`
4. `fix-powerbank-audio.js`
5. `fix-car-starter-final.js`
6. `restore-toys-products.js`
وغيرها.

**التعارضات والمشاكل في الـ Rules (Regex):**
- تعتمد معظم السكريبتات على `t.match(/كلمة/)`. 
- **False Positive:** كلمة "شاحن" تنقل الموبايل إلى "الشواحن".
- **False Positive:** كلمة "ألعاب" (صالة ألعاب رياضية) تنقل الحقيبة إلى "لعب أطفال".
- **False Positive:** كلمة "كاميرا" (لتسجيل الكاميرا) تنقل الميكروفون إلى "كاميرات مراقبة".
- السكريبتات المنفصلة أنشأت أقساماً بأسماء إنجليزية/عربية هجينة (`cat_kitchenapps`) وتجاهلت الأقسام العربية الأصلية (`cat_c4tky0yxa` الأجهزة المنزلية)، مما تسبب في ازدواجية المعنى وفراغ الأقسام الأصلية.

## 13. Recommended Final Taxonomy (لا يتم تنفيذه الآن)
يُوصى بإنشاء Taxonomy موحد يعتمد على شجرة واحدة ثابتة وحذف الأقسام المتكررة:
1. **المنزل والمطبخ** -> (أجهزة المطبخ والمنزل، أدوات المطبخ والطبخ، تنظيم وتخزين)
2. **الإلكترونيات** -> (موبايلات، صوتيات وميكروفونات، شواحن وباور بانك، كاميرات مراقبة، ملحقات)
3. **الصحة والجمال** -> (عطور، عناية شخصية، العناية بالبشرة)
4. **أزياء وملابس** -> (ملابس رجالية، ملابس نسائية، حقائب وشنط)
5. **مستلزمات السيارات** -> (إلكترونيات السيارات، أدوات طوارئ)
6. **الألعاب والترفيه** -> (ألعاب أطفال ودمى)

---

## IMPLEMENTATION PLAN — NOT EXECUTED

1. Finalize taxonomy
2. Create canonical category mapping
3. Create centralized classification engine
4. Reclassify existing products
5. Integrate classification into Amazon import
6. Integrate classification into Noon manual import
7. Add review mechanism for low-confidence products
8. Validate frontend
9. Run regression tests

**AUDIT COMPLETE — ZERO DATA MODIFICATIONS WERE MADE.**
