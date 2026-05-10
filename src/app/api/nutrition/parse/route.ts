import { NextRequest, NextResponse } from 'next/server';
import { parseMeal } from '@/lib/ai-parser';
import { searchFood } from '@/lib/food-service';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    // 1. AI Parsing (Extract name, quantity, unit, and SMART KEYWORDS)
    const parsedItems = await parseMeal(text);
    console.log('AI Parsed Items with Keywords:', JSON.stringify(parsedItems, null, 2));
    const outputItems = [];

    for (const item of parsedItems) {
      // 2. Database Search using AI-Enriched Keywords
      // We search for each keyword provided by the AI and combine results
      let allCandidates: any[] = [];
      const keywords = item.searchKeywords || [item.food];

      for (const kw of keywords) {
        const matches = await searchFood(kw);
        allCandidates = [...allCandidates, ...matches];
      }

      // Deduplicate by ID and Sort by relevance
      const uniqueCandidates = Array.from(new Map(allCandidates.map(c => [c.id, c])).values())
        .sort((a, b) => (b.score || 0) - (a.score || 0));
      
      const noDatabaseMatches = uniqueCandidates.length === 0;

      outputItems.push({
        id: Math.random().toString(36).substr(2, 9),
        originalName: item.food,
        quantity: item.quantity,
        unit: item.unit,
        candidates: uniqueCandidates.slice(0, 5), 
        selectedCandidateId: (!noDatabaseMatches) ? uniqueCandidates[0].id : null,
        aiEstimate: item.estimatedMacros || null,
        isUsingAiFallback: noDatabaseMatches
      });
    }

    return NextResponse.json({ items: outputItems });

  } catch (error: any) {
    console.error('Parse Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
