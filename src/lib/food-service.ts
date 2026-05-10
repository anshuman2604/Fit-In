import { supabase } from './supabase';

export async function searchFood(query: string) {
  const cleanQuery = query.toLowerCase().trim();
  const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 1);

  if (queryWords.length === 0) return [];

  // Construct word-based search filter
  // We want to find rows that contain ALL query words in any order
  const wordFilter = queryWords.map(w => `%${w}%`).join(''); // This is still ordered.
  
  // Better approach: Use Postgres full-text search capability or manual AND logic
  // For Supabase client, we'll try a flexible search first
  
  // 2. Search in foods
  let foodQuery = supabase
    .from('foods')
    .select('*, serving_units(*)');
    
  queryWords.forEach(word => {
    foodQuery = foodQuery.ilike('name', `%${word}%`);
  });

  const { data: foodMatches } = await foodQuery;

  // 1. Search in food_aliases
  let aliasQuery = supabase
    .from('food_aliases')
    .select('food_id, alias, foods(*, serving_units(*))');
  
  queryWords.forEach(word => {
    aliasQuery = aliasQuery.ilike('alias', `%${word}%`);
  });
  
  const { data: aliasMatches } = await aliasQuery;

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
  return Array.from(resultsMap.values()).sort((a, b) => b.score - a.score);
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
