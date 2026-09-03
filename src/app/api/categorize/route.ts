import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, store, metadata } = body;

    // Input validation
    if (!title || typeof title !== 'string' || title.length > 1000) {
      return NextResponse.json({ error: 'Invalid or missing title' }, { status: 400 });
    }

    const safeDescription = description ? String(description).substring(0, 3000) : '';

    // Fetch existing categories from Supabase (only products_by_category)
    const { data: categories } = await supabaseAdmin
      .from('sections')
      .select('category, title')
      .eq('type', 'products_by_category');

    if (!categories || categories.length === 0) {
      return NextResponse.json({ error: 'No categories available in the system' }, { status: 400 });
    }

    // Rule-based fallback keyword dictionary
    const keywordMap: { keywords: string[]; categoryId: string }[] = [
      { keywords: ['قميص', 'تيشرت', 'تي شيرت', 'بوكسر', 'فانلة', 'شرابات', 'حمالة صدر', 'بنطلون', 'جينز', 'ملابس', 'بلوزة', 'شنطة', 'حذاء', 'اديداس', 'دايس', 'كوتشي', 'أزياء', 'موضة'], categoryId: 'cat_fashion' },
      { keywords: ['موبايل', 'هاتف', 'سامسونج', 'آيفون', 'شاومي', 'نوكيا', 'سماعة', 'شاحن', 'باور بانك', 'إلكترونيات'], categoryId: 'cat_electronics' },
      { keywords: ['لابتوب', 'كمبيوتر', 'ماوس', 'كيبورد', 'شاشة'], categoryId: 'cat_laptops' },
      { keywords: ['مطبخ', 'قلاية', 'خلاط', 'كبة', 'غلاية', 'أجهزة منزلية', 'تكييف', 'غسالة', 'ثلاجة'], categoryId: 'cat_appliances' },
      { keywords: ['بشرة', 'شعر', 'عطر', 'غسول', 'صابون', 'شامبو', 'حلاقة', 'عناية'], categoryId: 'cat_beauty' }
    ];

    const titleLower = title.toLowerCase();
    let ruleMatchedCategory = '';
    for (const rule of keywordMap) {
      if (rule.keywords.some(kw => titleLower.includes(kw))) {
        const found = categories.find((c: { category: string; title: string }) => c.category === rule.categoryId || c.category.includes(rule.categoryId.replace('cat_', '')));
        if (found) {
          ruleMatchedCategory = found.category;
          break;
        }
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      const fallbackCat = ruleMatchedCategory || categories[0].category;
      const matchedCategory = categories.find(c => c.category === fallbackCat) || categories[0];
      return NextResponse.json({
        success: true,
        category: matchedCategory.category,
        categoryTitle: matchedCategory.title,
        confidence: 80,
        reason: 'Rule-based categorization fallback (AI key not set)'
      });
    }

    const categoriesListStr = categories.map(c => `- ID: "${c.category}" (Name: "${c.title}")`).join('\n');

    const prompt = `
You are an expert e-commerce catalog manager.
Your task is to categorize a product based on its title and description.
You MUST choose EXACTLY ONE category ID from the provided list. 
Do NOT invent new categories. Do NOT return any category ID that is not in the list.

Available Categories:
${categoriesListStr}

Product Title: ${title}
Product Description: ${safeDescription}
Store: ${store || 'Unknown'}
Metadata: ${metadata || 'None'}

Return your answer strictly as a JSON object with this format (do not wrap in markdown):
{
  "category": "exact_category_id_from_list",
  "confidence": 95,
  "reason": "Brief explanation in Arabic for this categorization"
}
`;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        const matchedCategory = categories.find(c => c.category === parsed.category);
        if (matchedCategory) {
          return NextResponse.json({
            success: true,
            category: matchedCategory.category,
            categoryTitle: matchedCategory.title,
            confidence: parsed.confidence || 90,
            reason: parsed.reason || 'AI Categorized'
          });
        }
      }
    } catch (aiErr: any) {
      console.warn('AI Categorize call failed, falling back to rule engine:', aiErr.message);
    }

    // Default Fallback if AI fails or returns invalid ID
    const fallbackCatId = ruleMatchedCategory || categories[0].category;
    const fallbackObj = categories.find(c => c.category === fallbackCatId) || categories[0];

    return NextResponse.json({
      success: true,
      category: fallbackObj.category,
      categoryTitle: fallbackObj.title,
      confidence: 75,
      reason: 'Rule-based fallback categorization'
    });

  } catch (error: any) {
    console.error('Categorize API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process AI categorization' }, { status: 500 });
  }
}
