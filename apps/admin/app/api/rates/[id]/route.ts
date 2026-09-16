import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { deleteRateRule, toggleRateRuleStatus } from '@hotel/db';

/**
 * DELETE /api/rates/[id] - Delete a rate rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await getServerStaff(request as any);

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden — Rates management is restricted to Owner' }, { status: 403 });
    }

    const resolvedParams = await params;
    const deleted = deleteRateRule(resolvedParams.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Rate rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Rate rule deleted' });
  } catch (error) {
    console.error('Delete rate rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/rates/[id] - Toggle active status of a rate rule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await getServerStaff(request as any);

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden — Rates management is restricted to Owner' }, { status: 403 });
    }

    const resolvedParams = await params;
    const updatedRule = toggleRateRuleStatus(resolvedParams.id);

    if (!updatedRule) {
      return NextResponse.json({ error: 'Rate rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, rule: updatedRule });
  } catch (error) {
    console.error('Toggle rate rule status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
