import { NextRequest, NextResponse } from 'next/server';
import { calculateMacros } from '@/lib/nutrition-engine';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { foodId, quantity, unit } = await req.json();
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!foodId || !quantity || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Calculate macros using deterministic math
    const result = await calculateMacros(foodId, quantity, unit);

    if (!result) {
      return NextResponse.json({ error: 'Invalid food or unit' }, { status: 404 });
    }

    // 2. Persist to Database
    const { error: dbError } = await supabase
      .from('meal_logs')
      .insert({
        user_id: user.id,
        food_id: foodId,
        food_name: result.foodName,
        quantity: quantity,
        unit: unit,
        calories: result.macros.calories,
        protein: result.macros.protein,
        carbs: result.macros.carbs,
        fats: result.macros.fats,
        is_verified: true
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, item: result });

  } catch (error: any) {
    console.error('Direct Logging Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
