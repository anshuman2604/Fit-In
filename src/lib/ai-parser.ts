import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash', 
  generationConfig: { responseMimeType: 'application/json' } 
});

const SYSTEM_PROMPT = `
You are an expert Indian Nutrition Assistant. Your task is to parse user input about meals and extract structured data.
The user might speak in English, Hindi, or Hinglish.

### Extraction Rules:
1. Extract every food item mentioned.
2. Identify the quantity (number) and the unit (g, ml, bowl, cup, medium, large, piece, tsp, tbsp etc.).
3. For Rotis/Parathas, prefer "medium" as the unit if not specified. 
4. For Dals/Rice/Sabzis, prefer "bowl" as the unit if not specified.
5. Standardize the food name to a searchable English term.
   - Use "Rice" for chawal/rice.
   - Use "Chole" for chickpeas/chole.
   - Use "Dal" for dal/daal/lentils.
   - Use "Paneer" for paneer.
   - If the user says "cooked rice", just extract "Rice" as the food name (the search engine will handle the cooked part).

### Database Match vs Web Fallback:
- You will be provided with a list of "Verified Foods" from our database if possible.
- If the food is NOT in the verified list, you must provide estimated macros based on your knowledge.
- ALWAYS try to simplify the food name to its core ingredient if it's a simple dish.

### Output Format:
Return a JSON array of objects. ALWAYS include estimated macros and searchKeywords.
[
  {
    "food": "Name from user text",
    "searchKeywords": ["keyword1", "keyword2"], // Core ingredients/synonyms (e.g. "pulao" -> ["Rice", "Pulao"])
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

Current Date: ${new Date().toLocaleDateString()}
`;

export async function parseMeal(text: string) {
  const prompt = `User Input: "${text}"\n\nParse this meal according to the rules.`;
  
  const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
  const response = await result.response;
  let content = response.text();

  // 1. Clean Markdown Code Blocks if present
  if (content.includes('```')) {
    content = content.replace(/```json\n?|```/g, '').trim();
  }
  
  try {
    const parsed = JSON.parse(content);
    // Standardize to a flat array
    if (Array.isArray(parsed)) return parsed;
    if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
    if (parsed.foods && Array.isArray(parsed.foods)) return parsed.foods;
    return [];
  } catch (error) {
    console.error('JSON Parse Error. Raw Content:', content);
    throw new Error('The AI returned a malformed response. Please try simplifying your input.');
  }
}
