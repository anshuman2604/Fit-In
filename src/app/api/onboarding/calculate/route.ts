import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('AI ONBOARDING ERROR: GEMINI_API_KEY is missing.');
      return NextResponse.json({ error: 'AI Config Missing' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const metrics = await req.json();
    const prompt = `Calculate targets for: ${JSON.stringify(metrics)}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      generationConfig: { responseMimeType: 'application/json' } 
    });

    const ONBOARDING_SYSTEM_PROMPT = `
You are an expert Fitness Coach and Nutritionist. Return a JSON object ONLY:
{
  "target_calories": number,
  "target_protein": number,
  "target_carbs": number,
  "target_fats": number,
  "explanation": "motivation"
}
`;

    const result = await model.generateContent([ONBOARDING_SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    let content = response.text();

    content = content.replace(/```json\n?|```/g, '').trim();
    return NextResponse.json(JSON.parse(content));

  } catch (error: any) {
    console.error('AI ONBOARDING EXCEPTION:', error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
