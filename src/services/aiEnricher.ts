import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export interface AIEnrichedData {
  cleanTitle: string;
  editorialReview: string;
  pros: string[];
  cons: string[];
  faqs: { question: string; answer: string }[];
  adVisualPrompt: string;
}

const responseSchema: Schema = {
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

export async function enrichProductData(rawTitle: string, rawDescription: string): Promise<AIEnrichedData | null> {
  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing');
    return null;
  }

  const prompt = `
    You are an expert copywriter and shopping advisor for Egyptian consumers on "بكام النهاردة".
    Analyze the following raw product data from Amazon Egypt.
    
    IMPORTANT RULES:
    1. Write entirely original content in Egyptian Arabic / Modern Standard Arabic.
    2. NEVER copy or scrape raw customer reviews from Amazon.
    3. Synthesize the overall value proposition, pros, and cons in your own words.
    
    Raw Title: ${rawTitle}
    Raw Details: ${rawDescription.substring(0, 1500)} // Truncated to avoid context bloat
    
    Return the response strictly as JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.5, // keep it slightly creative but grounded
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIEnrichedData;
    }
  } catch (error) {
    console.error('AI Enrichment failed:', error);
  }
  return null;
}
