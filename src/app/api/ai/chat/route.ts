import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('AI CHAT ERROR: GEMINI_API_KEY is missing.');
      return NextResponse.json({ error: 'AI Config Missing' }, { status: 500 });
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
Guide the user based ONLY on their real-time data below.

USER PROFILE: ${profile?.display_name}, Goal: ${profile?.goal}, ${profile?.weight_kg}kg, ${profile?.height_cm}cm.
TODAY'S REMAINING: ${targets.calories - consumed.calories} kcal (${targets.protein - consumed.protein}g P, ${targets.carbs - consumed.carbs}g C, ${targets.fats - consumed.fats}g F).

RULES:
1. Suggest specific Indian foods with measurements.
2. Use **Markdown** and **bold text** for numbers/foods.
3. Be concise. Reference remaining macros.
`;

    // 4. CALL AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Transform history
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: "Acknowledged. I am your Fit In Coach." }] },
        ...history
      ],
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    return NextResponse.json({ content: response.text() });

  } catch (error: any) {
    console.error('AI CHAT EXCEPTION:', error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
