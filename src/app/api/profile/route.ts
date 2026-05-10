import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      display_name, 
      target_calories, 
      target_protein, 
      target_carbs, 
      target_fats,
      age,
      gender,
      height_cm,
      weight_kg,
      activity_level,
      workouts,
      goal
    } = body;

    // Upsert the profile for the current user (create if missing, update if exists)
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id, // ID is required for upsert
        display_name,
        target_calories,
        target_protein,
        target_carbs,
        target_fats,
        age: parseInt(age),
        gender,
        height_cm: parseFloat(height_cm),
        weight_kg: parseFloat(weight_kg),
        activity_level,
        workouts,
        goal
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, profile: data });

  } catch (error: any) {
    console.error('Profile Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
