import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
});

const SYSTEM_PROMPT = `
You are an expert Indian Nutrition Assistant. Your task is to parse user input about meals and extract structured data.
The user might speak in English, Hindi, or Hinglish.

### Extraction Rules:
1. Extract every food item mentioned.
2. Identify the quantity (number) and the unit (g, ml, bowl, cup, medium, large, piece, tsp, tbsp etc.).
3. Standardize the food name to a searchable English term.

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
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('AI Parse Error: OPENROUTER_API_KEY is missing');
      return [];
    }

    const response = await openai.chat.completions.create({
      model: 'z-ai/glm-4.5-air:free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Parse this meal input: "${text}"` }
      ],
      response_format: { type: 'json_object' }
    });

    let content = response.choices[0].message.content || '[]';
    
    // Clean Markdown
    content = content.replace(/```json\n?|```/g, '').trim();
    
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
    if (parsed.foods && Array.isArray(parsed.foods)) return parsed.foods;
    return [];
  } catch (error) {
    console.error('AI Parse Error:', error);
    return [];
  }
}
