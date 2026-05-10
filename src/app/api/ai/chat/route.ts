import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing on server.' }, { status: 500 });
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
RULES: Suggest specific Indian foods. Use Markdown/Bold. Be concise.
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT // Correct way to handle system context
    });

    // TRANSFORM HISTORY: Ensure alternating User/Model roles
    // We skip the first greeting from the frontend to ensure history starts with 'user' if possible,
    // or we map it correctly. Google history MUST start with 'user' if not empty.
    const history = [];
    const chatMessages = messages.slice(0, -1);

    for (let i = 0; i < chatMessages.length; i++) {
      const msg = chatMessages[i];
      // Skip the initial greeting if it's the very first message in the history array
      if (i === 0 && msg.role === 'model') continue; 
      
      history.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    
    return NextResponse.json({ content: response.text() });

  } catch (error: any) {
    console.error('AI CHAT ERROR:', error);
    return NextResponse.json({ 
      error: 'AI Error', 
      details: error.message,
      suggestion: 'Check if gemini-2.5-flash is available for your API key.'
    }, { status: 500 });
  }
}
