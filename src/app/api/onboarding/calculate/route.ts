import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash', 
  generationConfig: { responseMimeType: 'application/json' } 
});

const ONBOARDING_SYSTEM_PROMPT = `
You are an expert Fitness Coach and Nutritionist. Your task is to calculate a user's maintenance calories (TDEE) and provide an optimized macro split based on their body metrics and fitness goals.

### User Metrics to Process:
- Age, Gender, Height (cm), Weight (kg)
- Activity Level (Sedentary, Lightly Active, Active, Very Active)
- Workouts (Boolean)
- Fitness Goal (Cut, Bulk, Recomp)

### Calculation Rules:
1. Use the Mifflin-St Jeor Equation for BMR.
2. Apply standard Activity Multipliers for TDEE based on the provided level.
3. Adjust calories for the Goal:
   - Cut: -500 kcal from TDEE.
   - Bulk: +300 to +500 kcal from TDEE.
   - Recomp: Maintain TDEE.
4. Macro Split Rules:
   - Protein: Target 2.0g per kg of bodyweight (rounded).
   - Fats: Target 0.8g to 1g per kg of bodyweight.
   - Carbs: Fill the remaining calories.

### Output Format:
Return a JSON object ONLY:
{
  "target_calories": number,
  "target_protein": number,
  "target_carbs": number,
  "target_fats": number,
  "explanation": "A short, 2-3 sentence motivational explanation of why this plan was chosen for their body type."
}
`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await req.json();
    const prompt = `Calculate targets for: ${JSON.stringify(metrics)}`;

    const result = await model.generateContent([ONBOARDING_SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    let content = response.text();

    // Clean Markdown code blocks if present
    if (content.includes('```')) {
      content = content.replace(/```json\n?|```/g, '').trim();
    }

    const aiRecommendation = JSON.parse(content);

    return NextResponse.json(aiRecommendation);

  } catch (error: any) {
    console.error('Onboarding Calculation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
