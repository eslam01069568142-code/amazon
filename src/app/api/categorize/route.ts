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

    const apiKey = process.env.GEMINI_API_KEY || process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set');
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 503 });
    }

    // Fetch existing categories from Supabase (only products_by_category)
    const { data: categories } = await supabaseAdmin
      .from('sections')
      .select('category, title')
      .eq('type', 'products_by_category');

    if (!categories || categories.length === 0) {
      return NextResponse.json({ error: 'No categories available in the system' }, { status: 400 });
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

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from AI');
    }

    const parsed = JSON.parse(text);

    // Validate that the returned category is actually in our list
    const matchedCategory = categories.find(c => c.category === parsed.category);
    if (!matchedCategory) {
      throw new Error(`AI suggested invalid category: ${parsed.category}`);
    }

    return NextResponse.json({
      success: true,
      category: parsed.category,
      categoryTitle: matchedCategory.title,
      confidence: parsed.confidence,
      reason: parsed.reason
    });

  } catch (error: any) {
    console.error('Categorize API Error:', error);
    // Gracefully fallback so the client can handle manual selection
    return NextResponse.json({ success: false, error: 'Failed to process AI categorization' }, { status: 500 });
  }
}
