export interface Food {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  is_cooked: boolean;
}

export interface ServingUnit {
  id: string;
  food_id: string;
  unit_name: string;
  weight_in_grams: number;
}

export interface CalculatedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  totalWeight: number;
}

export interface NutritionRequest {
  foodId: string;
  quantity: number;
  unitName: string; // e.g., 'bowl', 'piece', 'g'
}

export interface NutritionResponse {
  foodName: string;
  macros: CalculatedMacros;
  isVerified: boolean; // false if AI Web Fallback was used
  warning?: string;
}
