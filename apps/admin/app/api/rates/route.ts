import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { getRateRules, addRateRule } from '@hotel/db';

/**
 * GET /api/rates - List all rate rules
 * Accessible to MANAGER and OWNER roles
 */
export async function GET(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'MANAGER' && staff.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rules = getRateRules();
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('List rate rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/rates - Create a new rate rule
 * Accessible to MANAGER and OWNER roles
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'MANAGER' && staff.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Rule name is required' }, { status: 400 });
    }

    if (!body.adjustmentType || !['PERCENTAGE', 'FLAT_AMOUNT'].includes(body.adjustmentType)) {
      return NextResponse.json({ error: 'Valid adjustment type (PERCENTAGE or FLAT_AMOUNT) is required' }, { status: 400 });
    }

    if (typeof body.adjustmentValue !== 'number' || isNaN(body.adjustmentValue)) {
      return NextResponse.json({ error: 'Adjustment value must be a valid number' }, { status: 400 });
    }

    const newRule = addRateRule({
      name: body.name.trim(),
      roomType: body.roomType && body.roomType !== 'ALL' ? body.roomType.trim() : null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      daysOfWeek: Array.isArray(body.daysOfWeek) ? body.daysOfWeek : [],
      adjustmentType: body.adjustmentType,
      adjustmentValue: body.adjustmentValue,
      active: true,
    });

    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error('Create rate rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
