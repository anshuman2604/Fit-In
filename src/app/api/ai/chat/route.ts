import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();

    // 1. FETCH USER CONTEXT
    // A. Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // B. Fetch Today's Logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: logs } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', today.toISOString());

    // 2. CALCULATE REMAINING MACROS
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

    const remaining = {
      calories: Math.max(targets.calories - consumed.calories, 0),
      protein: Math.max(targets.protein - consumed.protein, 0),
      carbs: Math.max(targets.carbs - consumed.carbs, 0),
      fats: Math.max(targets.fats - consumed.fats, 0),
    };

    // 3. CONSTRUCT SYSTEM PROMPT WITH REAL CONTEXT
    const SYSTEM_PROMPT = `
You are the "Fit In Coach", a highly personalized Indian fitness and nutrition mentor. 
Your goal is to guide the user based ONLY on their real-time data provided below.

### USER PROFILE:
- Name: ${profile?.display_name || 'User'}
- Goal: ${profile?.goal || 'General Health'}
- Body: ${profile?.weight_kg}kg, ${profile?.height_cm}cm, ${profile?.age}yo ${profile?.gender}
- Activity: ${profile?.activity_level}, Workouts: ${profile?.workouts ? 'Yes' : 'No'}

### TODAY'S STATUS:
- Target: ${targets.calories} kcal (${targets.protein}g P, ${targets.carbs}g C, ${targets.fats}g F)
- Consumed: ${Math.round(consumed.calories)} kcal (${Math.round(consumed.protein)}g P, ${Math.round(consumed.carbs)}g C, ${Math.round(consumed.fats)}g F)
- REMAINING: ${Math.round(remaining.calories)} kcal (${Math.round(remaining.protein)}g P, ${Math.round(remaining.carbs)}g C, ${Math.round(remaining.fats)}g F)

### RULES:
1. **Tone:** Professional, authoritative yet encouraging. Act like a high-end personal health consultant.
2. **Precision:** Always suggest food with specific measurements (e.g., "150g Moong Dal", "2 medium Rotis").
3. **Unit Flexibility:** If the user asks for household measurements or if it's more practical, use units like "1 bowl", "1 tsp", "1 cup", etc.
4. **Readability (CRITICAL):** Use **Markdown formatting**. Use **bold text** for key numbers and food items. Use bullet points for lists. Break long paragraphs into short, digestible lines.
5. **Context:** Reference their specific remaining macros in EVERY response.
6. **Indian Cuisine:** Prioritize healthy Indian home-cooked staples.
7. **Conciseness:** Do not ramble. Get straight to the data-backed recommendation.
`;

    // 4. CALL AI
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: "Understood. I am now the Fit In Coach. I will provide personalized guidance based on the provided metrics and macro data. How can I help you today?" }] },
      ],
    });

    // Send the user's latest message
    const lastUserMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastUserMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
