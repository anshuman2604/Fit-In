import { NextRequest, NextResponse } from 'next/server';
import { calculateMacros } from '@/lib/nutrition-engine';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    console.log('RECEIVED ITEMS FOR BULK LOG:', JSON.stringify(items, null, 2));
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const logsToInsert = [];

    for (const item of items) {
      console.log('Processing item for bulk log:', item.originalName, 'Fallback:', item.isUsingAiFallback);
      
      if (item.isUsingAiFallback && item.aiEstimate) {
        console.log('Saving as AI Fallback (Explicitly requested)');
        logsToInsert.push({
          user_id: user.id,
          food_name: item.originalName,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.aiEstimate.calories,
          protein: item.aiEstimate.protein,
          carbs: item.aiEstimate.carbs,
          fats: item.aiEstimate.fats,
          is_verified: false,
          meal_type: 'Snacks'
        });
      } else if (item.selectedCandidateId) {
        const result = await calculateMacros(item.selectedCandidateId, item.quantity, item.unit);
        if (result) {
          console.log('Saving as Verified (Math Success):', result.foodName);
          logsToInsert.push({
            user_id: user.id,
            food_id: item.selectedCandidateId,
            food_name: result.foodName,
            quantity: item.quantity,
            unit: item.unit,
            calories: result.macros.calories,
            protein: result.macros.protein,
            carbs: result.macros.carbs,
            fats: result.macros.fats,
            is_verified: true,
            meal_type: 'Snacks'
          });
        } else {
          console.log('Math engine failed for verified item. Falling back to AI macros.');
          if (item.aiEstimate) {
            logsToInsert.push({
              user_id: user.id,
              food_name: item.originalName,
              quantity: item.quantity,
              unit: item.unit,
              calories: item.aiEstimate.calories,
              protein: item.aiEstimate.protein,
              carbs: item.aiEstimate.carbs,
              fats: item.aiEstimate.fats,
              is_verified: false,
              meal_type: 'Snacks'
            });
          }
        }
      } else if (item.aiEstimate) {
        console.log('Saving as AI Fallback (No Match Selected)');
        logsToInsert.push({
          user_id: user.id,
          food_name: item.originalName,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.aiEstimate.calories,
          protein: item.aiEstimate.protein,
          carbs: item.aiEstimate.carbs,
          fats: item.aiEstimate.fats,
          is_verified: false,
          meal_type: 'Snacks'
        });
      }
    }

    if (logsToInsert.length > 0) {
      const { error } = await supabase.from('meal_logs').insert(logsToInsert);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, count: logsToInsert.length });

  } catch (error: any) {
    console.error('Bulk Log Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
