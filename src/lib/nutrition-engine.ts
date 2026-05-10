import { supabase } from './supabase';
import { Food, ServingUnit, CalculatedMacros } from '@/types/nutrition';

/**
 * The core deterministic math engine for calculating macros.
 * Formula: ((quantity * unit_weight) / 100) * base_macro
 */
export async function calculateMacros(
  foodId: string,
  quantity: number,
  unitName: string
): Promise<{ foodName: string; macros: CalculatedMacros } | null> {
  
  // 1. Fetch food macros (per 100g)
  const { data: food, error: foodError } = await supabase
    .from('foods')
    .select('*')
    .eq('id', foodId)
    .single();

  if (foodError || !food) return null;

  let weightInGrams = 0;

  // 2. Determine weight based on unit
  const unit = unitName.toLowerCase().trim();
  const isGram = ['g', 'grams', 'gram', 'gm', 'gms'].includes(unit);

  if (isGram) {
    weightInGrams = quantity;
  } else {
    // Try exact match first
    let { data: unit, error: unitError } = await supabase
      .from('serving_units')
      .select('weight_in_grams')
      .eq('food_id', foodId)
      .eq('unit_name', unitName.toLowerCase())
      .single();

    // Fallback: If AI says 'piece' but database has 'medium', or vice versa
    if (!unit) {
      const fallbackUnit = unitName.toLowerCase() === 'piece' ? 'medium' : 
                          unitName.toLowerCase() === 'medium' ? 'piece' : null;
      
      if (fallbackUnit) {
        const { data: fUnit } = await supabase
          .from('serving_units')
          .select('weight_in_grams')
          .eq('food_id', foodId)
          .eq('unit_name', fallbackUnit)
          .single();
        unit = fUnit;
      }
    }

    if (!unit) return null;
    weightInGrams = quantity * unit.weight_in_grams;
  }

  // 3. Perform the deterministic math
  const factor = weightInGrams / 100;

  return {
    foodName: food.name,
    macros: {
      calories: Number((food.calories * factor).toFixed(2)),
      protein: Number((food.protein * factor).toFixed(2)),
      carbs: Number((food.carbs * factor).toFixed(2)),
      fats: Number((food.fats * factor).toFixed(2)),
      totalWeight: weightInGrams,
    },
  };
}
