import { supabase } from './supabase';

export async function searchFood(query: string) {
  try {
    const cleanQuery = query.toLowerCase().trim();
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 1);

    if (queryWords.length === 0) return [];

    // 1. Search in foods
    let foodQuery = supabase
      .from('foods')
      .select('*, serving_units(*)');
      
    queryWords.forEach(word => {
      foodQuery = foodQuery.ilike('name', `%${word}%`);
    });

    const { data: foodMatches, error: foodError } = await foodQuery;
    if (foodError) console.error('Food Search Error:', foodError);

    // 2. Search in food_aliases (Optional table)
    let aliasMatches: any[] = [];
    try {
      let aliasQuery = supabase
        .from('food_aliases')
        .select('food_id, alias, foods(*, serving_units(*))');
      
      queryWords.forEach(word => {
        aliasQuery = aliasQuery.ilike('alias', `%${word}%`);
      });
      
      const { data, error } = await aliasQuery;
      if (!error && data) aliasMatches = data;
    } catch (e) {
      // Ignore if table doesn't exist
      console.warn('food_aliases table might be missing, skipping alias search.');
    }

    const resultsMap = new Map();

    // Process alias matches
    aliasMatches?.forEach((match: any) => {
      if (match.foods) {
        const food = match.foods;
        const score = calculateScore(cleanQuery, match.alias, food.name);
        
        if (!resultsMap.has(food.id) || score > resultsMap.get(food.id).score) {
          resultsMap.set(food.id, {
            ...food,
            matchType: 'alias',
            matchedVia: match.alias,
            score: score
          });
        }
      }
    });

    // Process direct food matches
    foodMatches?.forEach((food: any) => {
      const score = calculateScore(cleanQuery, food.name, food.name);
      
      if (!resultsMap.has(food.id) || score > resultsMap.get(food.id).score) {
        resultsMap.set(food.id, {
          ...food,
          matchType: 'direct',
          score: score
        });
      }
    });

    // Sort by score descending
    return Array.from(resultsMap.values()).sort((a, b) => (b.score || 0) - (a.score || 0));
  } catch (error) {
    console.error('Global Search Error:', error);
    return [];
  }
}

/**
 * Advanced scoring algorithm to favor exact and simple matches.
 */
function calculateScore(query: string, matchTerm: string, foodName: string): number {
  const term = matchTerm.toLowerCase();
  const q = query.toLowerCase();
  const words = term.split(/\s+/);
  let score = 0;

  if (term === q) {
    score += 2000; // Absolute exact match
  } else if (words.includes(q)) {
    score += 1000; // Whole word match
  } else if (term.startsWith(q)) {
    score += 500; // Starts with
  } else {
    score += 100; // Contains
  }

  // Bonus for shorter names (favors staples over complex dishes)
  score += (100 - foodName.length);

  // Penalty for "Restaurant" or "Street Food" category if match is weak
  if (foodName.toLowerCase().includes('style') || foodName.toLowerCase().includes('fried')) {
    score -= 200;
  }

  return score;
}

export async function logMissingFood(term: string) {
  const { error } = await supabase
    .from('missing_food_requests')
    .insert({ searched_term: term });
  
  if (error) {
    console.error('Error logging missing food:', error);
  }
}
