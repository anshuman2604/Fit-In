import { NextRequest, NextResponse } from 'next/server';
import { searchFood } from '@/lib/food-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchFood(query);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
