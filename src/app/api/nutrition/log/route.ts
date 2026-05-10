import { NextRequest, NextResponse } from 'next/server';
import { parseMeal } from '@/lib/ai-parser';
import { searchFood, logMissingFood } from '@/lib/food-service';
import { calculateMacros } from '@/lib/nutrition-engine';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();

    if (!text) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    // 1. AI Parsing
    const parsedItems = await parseMeal(text);
    const finalLogs = [];

    for (const item of parsedItems) {
      // 2. Database Search
      const matches = await searchFood(item.food);
      
      let logEntry: any = null;

      if (matches.length > 0) {
        // We found a match in our Gold Standard Database
        const bestMatch = matches[0];
        const calculation = await calculateMacros(bestMatch.id, item.quantity, item.unit);

        if (calculation) {
          logEntry = {
            food_name: calculation.foodName,
            food_id: bestMatch.id,
            quantity: item.quantity,
            unit: item.unit,
            calories: calculation.macros.calories,
            protein: calculation.macros.protein,
            carbs: calculation.macros.carbs,
            fats: calculation.macros.fats,
            is_verified: true,
            user_id: user?.id
          };
        }
      }

      if (!logEntry) {
        // 3. Fallback Path (Not found in DB)
        await logMissingFood(item.food);
        
        logEntry = {
          food_name: item.food,
          food_id: null,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.estimatedMacros.calories,
          protein: item.estimatedMacros.protein,
          carbs: item.estimatedMacros.carbs,
          fats: item.estimatedMacros.fats,
          is_verified: false,
          user_id: user?.id,
          warning: "⚠️ This food is not in our verified database. Macros are AI-estimated and may be incorrect."
        };
      }

      // 4. Persist to Database if user is logged in
      if (user) {
        const { error: dbError } = await supabase
          .from('meal_logs')
          .insert({
            user_id: user.id,
            food_id: logEntry.food_id,
            food_name: logEntry.food_name,
            quantity: logEntry.quantity,
            unit: logEntry.unit,
            calories: logEntry.calories,
            protein: logEntry.protein,
            carbs: logEntry.carbs,
            fats: logEntry.fats,
            is_verified: logEntry.is_verified,
            meal_type: 'Snacks' // Default for now
          });
        
        if (dbError) console.error('Database Error:', dbError);
      }

      finalLogs.push({
        foodName: logEntry.food_name,
        quantity: logEntry.quantity,
        unit: logEntry.unit,
        macros: {
          calories: logEntry.calories,
          protein: logEntry.protein,
          carbs: logEntry.carbs,
          fats: logEntry.fats
        },
        isVerified: logEntry.is_verified,
        warning: logEntry.warning
      });
    }

    return NextResponse.json({ items: finalLogs });

  } catch (error: any) {
    console.error('Logging Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
