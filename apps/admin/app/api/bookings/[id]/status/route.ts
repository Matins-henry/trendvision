import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

const VALID_STATUSES = ['CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'] as const;
type TargetStatus = (typeof VALID_STATUSES)[number];

/**
 * PATCH /api/bookings/[id]/status - Update booking lifecycle status
 * Allowed roles: RECEPTIONIST, MANAGER (403 for OWNER)
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

    const { id } = await params;
    const body = await request.json();
    const { status: targetStatus, keycardCode } = body;

    if (!targetStatus || !VALID_STATUSES.includes(targetStatus as TargetStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const currentStatus = booking.status;

    // Validate lifecycle transitions
    if (targetStatus === 'CHECKED_IN' && currentStatus !== 'CONFIRMED' && currentStatus !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot check in a booking with status ${currentStatus}. Must be CONFIRMED or PENDING.` },
        { status: 400 }
      );
    }

    if (targetStatus === 'CHECKED_OUT' && currentStatus !== 'CHECKED_IN') {
      return NextResponse.json(
        { error: `Cannot check out a booking with status ${currentStatus}. Must be CHECKED_IN.` },
        { status: 400 }
      );
    }

    if (targetStatus === 'CANCELLED' && (currentStatus === 'CHECKED_IN' || currentStatus === 'CHECKED_OUT')) {
      return NextResponse.json(
        { error: `Cannot cancel a booking that is already ${currentStatus}.` },
        { status: 400 }
      );
    }

    // Determine Keycard code
    let finalKeycardCode = booking.keycardCode;
    if (targetStatus === 'CHECKED_IN') {
      finalKeycardCode = keycardCode?.trim() || `KC-${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (targetStatus === 'CHECKED_OUT' || targetStatus === 'CANCELLED') {
      finalKeycardCode = null;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: targetStatus as TargetStatus,
        keycardCode: finalKeycardCode,
      },
      include: {
        guest: { select: { id: true, name: true, email: true, phone: true } },
        room: { select: { id: true, number: true, type: true, baseRate: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error('PATCH /api/bookings/[id]/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
