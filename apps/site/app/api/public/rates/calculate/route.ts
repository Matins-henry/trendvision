import { NextRequest, NextResponse } from 'next/server';
import { calculateStayPrice } from '@hotel/db';

/**
 * POST /api/public/rates/calculate
 * Public API to calculate dynamic stay rates with itemized nightly breakdown
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const baseRate = Number(body.baseRate);
    if (isNaN(baseRate) || baseRate <= 0) {
      return NextResponse.json({ error: 'Valid baseRate is required' }, { status: 400 });
    }

    if (!body.checkIn || !body.checkOut) {
      return NextResponse.json({ error: 'checkIn and checkOut dates are required' }, { status: 400 });
    }

    const result = calculateStayPrice({
      baseRate,
      roomType: body.roomType || null,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculate rates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
