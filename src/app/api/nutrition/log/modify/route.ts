import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { calculateMacros } from '@/lib/nutrition-engine';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const supabase = await createClient();

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, foodId, quantity, unit } = await req.json();
    const supabase = await createClient();

    if (!id || !quantity || !unit) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Recalculate macros if it was a verified food
    let updateData: any = {
      quantity,
      unit,
    };

    if (foodId) {
      const result = await calculateMacros(foodId, quantity, unit);
      if (result) {
        updateData.calories = result.macros.calories;
        updateData.protein = result.macros.protein;
        updateData.carbs = result.macros.carbs;
        updateData.fats = result.macros.fats;
      }
    }

    // 2. Update DB
    const { error } = await supabase
      .from('meal_logs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
