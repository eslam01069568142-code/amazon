require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI, Type } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not defined in .env.local');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    cleanArabicTitle: { type: Type.STRING, description: "A clean, human-readable attractive Arabic title for the product." }
  },
  required: ['cleanArabicTitle'],
};

async function translateTitle(rawTitle) {
  const prompt = `
    You are an expert copywriter for an Egyptian e-commerce site "بكام النهاردة".
    Translate and rewrite the following English/Mixed product title into a clean, attractive, and natural Egyptian Arabic title.
    
    Raw Title: ${rawTitle}
    
    Return the response strictly as JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.3,
      }
    });

    if (response.text) {
      return JSON.parse(response.text).cleanArabicTitle;
    }
  } catch (error) {
    console.error('AI Translation failed:', error.message);
  }
  return null;
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log('🚀 Starting English Products Translation Fix...\n');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, ai_data');

  if (error) {
    console.error('❌ Failed to fetch products:', error);
    process.exit(1);
  }

  // Regex to find English words (4 or more letters)
  const englishRegex = /[a-zA-Z]{4,}/;
  
  const productsToFix = products.filter(p => englishRegex.test(p.title));

  console.log(`📦 Found ${productsToFix.length} products with English titles needing translation.`);

  for (let i = 0; i < productsToFix.length; i++) {
    const p = productsToFix[i];
    console.log(`\n[${i + 1}/${productsToFix.length}] Translating: ${p.title}`);
    
    const translatedTitle = await translateTitle(p.title);
    
    if (translatedTitle) {
      console.log(`   -> ${translatedTitle}`);
      
      // Update title and ai_data with the clean title
      let newAiData = p.ai_data || {};
      newAiData.cleanTitle = translatedTitle;

      const { error: updateErr } = await supabase
        .from('products')
        .update({ 
           title: translatedTitle,
           ai_data: newAiData
        })
        .eq('id', p.id);

      if (updateErr) {
        console.error(`❌ Failed to update ${p.id}:`, updateErr.message);
      } else {
        console.log(`✅ Success for ${p.id}`);
      }
    } else {
      console.log(`⏭️ Skipped ${p.id} due to translation failure.`);
    }

    // Rate limiting delay (2 seconds)
    if (i < productsToFix.length - 1) {
      await delay(2000);
    }
  }

  console.log('\n🎉 Translation complete!');
  process.exit(0);
}

main();
