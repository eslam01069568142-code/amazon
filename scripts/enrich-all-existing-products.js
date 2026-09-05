require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI, Type, Schema } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not defined in .env.local');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    cleanTitle: { type: Type.STRING, description: "A clean, human-readable Arabic title for the product." },
    editorialReview: { type: Type.STRING, description: "2 original paragraphs explaining who the product is for and key practical advice for Egyptian shoppers." },
    pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 original bullet points highlighting real value. DO NOT COPY AMAZON REVIEWS." },
    cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 honest considerations / tips before buying. DO NOT COPY AMAZON REVIEWS." },
    faqs: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT, 
        properties: { 
          question: { type: Type.STRING }, 
          answer: { type: Type.STRING } 
        } 
      },
      description: "3 helpful Q&As for shoppers (e.g. warranty, usage, compatibility)." 
    },
    adVisualPrompt: { type: Type.STRING, description: "Ready Midjourney/Canva prompt for branded social media ads." }
  },
  required: ['cleanTitle', 'editorialReview', 'pros', 'cons', 'faqs', 'adVisualPrompt'],
};

async function enrichProductData(rawTitle, rawDescription) {
  const prompt = `
    You are an expert copywriter and shopping advisor for Egyptian consumers on "بكام النهاردة".
    Analyze the following raw product data from Amazon Egypt.
    
    IMPORTANT RULES:
    1. Write entirely original content in Egyptian Arabic / Modern Standard Arabic.
    2. NEVER copy or scrape raw customer reviews from Amazon.
    3. Synthesize the overall value proposition, pros, and cons in your own words.
    
    Raw Title: ${rawTitle}
    Raw Details: ${String(rawDescription).substring(0, 1500)} // Truncated to avoid context bloat
    
    Return the response strictly as JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.5,
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (error) {
    console.error('AI Enrichment failed:', error.message);
  }
  return null;
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log('🚀 Starting Batch AI Enrichment Process...\n');

  // Fetch all products that don't have ai_data yet
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, description, ai_data');

  if (error) {
    console.error('❌ Failed to fetch products:', error);
    process.exit(1);
  }

  const productsToEnrich = products.filter(p => !p.ai_data);

  console.log(`📦 Found ${productsToEnrich.length} products needing enrichment.`);

  for (let i = 0; i < productsToEnrich.length; i++) {
    const p = productsToEnrich[i];
    console.log(`\n[${i + 1}/${productsToEnrich.length}] Enriching: ${p.id}`);
    
    const enrichedData = await enrichProductData(p.title, p.description);
    
    if (enrichedData) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({ ai_data: enrichedData })
        .eq('id', p.id);

      if (updateErr) {
        console.error(`❌ Failed to save enrichment for ${p.id}:`, updateErr.message);
      } else {
        console.log(`✅ Success for ${p.id}`);
      }
    } else {
      console.log(`⏭️ Skipped ${p.id} due to enrichment failure.`);
    }

    // Rate limiting delay (2 seconds)
    if (i < productsToEnrich.length - 1) {
      console.log('⏳ Waiting 2 seconds to respect API limits...');
      await delay(2000);
    }
  }

  console.log('\n🎉 Batch process complete!');
  process.exit(0);
}

main();
