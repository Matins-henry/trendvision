import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * GET /api/bookings/queue
 * Returns queue lists for dedicated Check-In and Check-Out pages.
 * Query params: ?type=check-in|check-out
 * Allowed roles: RECEPTIONIST, MANAGER (403 for OWNER)
 */
export async function GET(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type !== 'check-in' && type !== 'check-out') {
      return NextResponse.json(
        { error: 'Invalid queue type. Must be check-in or check-out.' },
        { status: 400 }
      );
    }

    const now = new Date();
    // End of today for matching check-in/out dates due today or overdue
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let whereCondition: any = {};

    if (type === 'check-in') {
      // Arrivals due today or overdue (CONFIRMED or PENDING)
      whereCondition = {
        status: { in: ['CONFIRMED', 'PENDING'] },
        checkIn: { lte: endOfToday },
      };
    } else {
      // Departures due today or currently checked in
      whereCondition = {
        status: 'CHECKED_IN',
        checkOut: { lte: endOfToday },
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereCondition,
      include: {
        guest: { select: { id: true, name: true, email: true, phone: true } },
        room: { select: { id: true, number: true, type: true, baseRate: true } },
        payments: {
          where: { status: 'COMPLETED' },
          select: { amount: true },
        },
      },
      orderBy: type === 'check-in' ? { checkIn: 'asc' } : { checkOut: 'asc' },
    });

    // Format queue items with balance calculation
    const items = bookings.map((b) => {
      const totalAmount = Number(b.totalAmount);
      const totalPaid = b.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceOwing = Math.max(0, Number((totalAmount - totalPaid).toFixed(2)));

      return {
        id: b.id,
        reference: b.reference,
        status: b.status,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        totalAmount,
        totalPaid: Number(totalPaid.toFixed(2)),
        balanceOwing,
        guest: b.guest,
        room: b.room,
      };
    });

    return NextResponse.json({
      type,
      count: items.length,
      queue: items,
    });
  } catch (error) {
    console.error('GET /api/bookings/queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
