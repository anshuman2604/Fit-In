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

    const { messages } = await req.json();

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data: logs } = await supabase.from('meal_logs').select('*').eq('user_id', user.id).gte('logged_at', today.toISOString());

    const consumed = (logs || []).reduce((acc, log) => ({
      calories: acc.calories + Number(log.calories),
      protein: acc.protein + Number(log.protein),
      carbs: acc.carbs + Number(log.carbs),
      fats: acc.fats + Number(log.fats),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const targets = {
      calories: profile?.target_calories || 0,
      protein: profile?.target_protein || 0,
      carbs: profile?.target_carbs || 0,
      fats: profile?.target_fats || 0,
    };

    const SYSTEM_PROMPT = `
You are the "Fit In Coach", a personalized Indian nutrition mentor. 
USER: ${profile?.display_name}, Goal: ${profile?.goal}.
REMAINING: ${targets.calories - consumed.calories} kcal (${targets.protein - consumed.protein}g P, ${targets.carbs - consumed.carbs}g C, ${targets.fats - consumed.fats}g F).
RULES: Suggest specific Indian foods. Use Markdown. Be concise.
`;

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const response = await openai.chat.completions.create({
      model: 'z-ai/glm-4.5-air:free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      ]
    });

    return NextResponse.json({ content: response.choices[0].message.content });

  } catch (error: any) {
    console.error('AI CHAT ERROR:', error);
    return NextResponse.json({ error: 'The AI is currently busy. Please try again in a moment.' }, { status: 500 });
  }
}
