import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { LUCKNOW_AREAS, PROPERTY_TYPES, BUDGET_RANGES } from '@/lib/lucknowData';

export async function GET() {
  try {
    // Return Lucknow-specific data
    const data = {
      areas: LUCKNOW_AREAS.map((a) => a.name),
      propertyTypes: PROPERTY_TYPES,
      budgetRanges: BUDGET_RANGES,
      facilities: LUCKNOW_AREAS,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location data' },
      { status: 500 }
    );
  }
}
