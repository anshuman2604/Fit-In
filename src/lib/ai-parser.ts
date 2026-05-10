import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
   - If the user says "cooked rice", just extract "Rice" as the food name.

### Output Format:
Return a JSON array of objects ONLY. ALWAYS include estimated macros and searchKeywords.
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
    if (!apiKey) {
      console.error('AI Parse Error: GEMINI_API_KEY is missing');
      return [];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      generationConfig: { responseMimeType: 'application/json' } 
    });

    console.log('AI Parse: Parsing meal:', text);

    const prompt = `User Input: "${text}"\n\nReturn JSON ONLY according to rules.`;
    const result = await model.generateContent(SYSTEM_PROMPT + "\n\n" + prompt);
    const response = await result.response;
    let content = response.text();

    // Clean Markdown
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
