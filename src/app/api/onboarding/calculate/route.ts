import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI configuration error.' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const metrics = await req.json();
    const prompt = `Calculate targets for: ${JSON.stringify(metrics)}`;

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
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

    const response = await openai.chat.completions.create({
      model: 'z-ai/glm-4.5-air:free',
      messages: [
        { role: 'system', content: ONBOARDING_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    let content = response.choices[0].message.content || '{}';
    content = content.replace(/```json\n?|```/g, '').trim();
    return NextResponse.json(JSON.parse(content));

  } catch (error: any) {
    console.error('AI ONBOARDING ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
