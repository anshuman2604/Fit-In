import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `
You are an expert Indian Nutrition Assistant. Your task is to parse user input about meals and extract structured data.
The user might speak in English, Hindi, or Hinglish.

### Extraction Rules:
1. Extract every food item mentioned.
2. Identify the quantity (number) and the unit (g, ml, bowl, cup, medium, large, piece, tsp, tbsp etc.).
3. Standardize the food name to a searchable English term.

### Output Format:
Return a JSON array of objects. ALWAYS include estimated macros and searchKeywords.
[
  {
    "food": "Name from user text",
    "searchKeywords": ["keyword1", "keyword2"], 
    "quantity": number,
    "unit": "unit",
    "isEstimated": boolean, 
    "estimatedMacros": { 
      "calories": number,
      "protein": number,
      "carbs": number,
      "fats": number
    }
  }
]
`;

export async function parseMeal(text: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      systemInstruction: SYSTEM_PROMPT, // Cleaned up: Using official systemInstruction
      generationConfig: { responseMimeType: 'application/json' } 
    });

    const prompt = `Parse this meal input: "${text}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text();

    content = content.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(content);
    
    if (Array.isArray(parsed)) return parsed;
    if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
    return [];
  } catch (error) {
    console.error('AI Parse Error:', error);
    return [];
  }
}
