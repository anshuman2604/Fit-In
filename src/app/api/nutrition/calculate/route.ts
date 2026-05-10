import { NextRequest, NextResponse } from 'next/server';
import { calculateMacros } from '@/lib/nutrition-engine';

export async function POST(req: NextRequest) {
  try {
    const { foodId, quantity, unitName } = await req.json();

    if (!foodId || !quantity || !unitName) {
      return NextResponse.json(
        { error: 'Missing required fields: foodId, quantity, unitName' },
        { status: 400 }
      );
    }

    const result = await calculateMacros(foodId, quantity, unitName);

    if (!result) {
      return NextResponse.json(
        { error: 'Food or unit not found in verified database' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      foodName: result.foodName,
      macros: result.macros,
      isVerified: true,
    });
  } catch (error) {
    console.error('Calculation Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
