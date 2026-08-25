import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@hotel/db/src/availability';

/**
 * POST /api/public/manage-booking/lookup
 * Public reservation lookup via Reference Code + Guest Email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, email } = body;

    if (!reference || !email) {
      return NextResponse.json(
        { error: 'Both Booking Reference and Guest Email are required.' },
        { status: 400 }
      );
    }

    const cleanRef = reference.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Query booking matching reference & guest email
    const booking = await prisma.booking.findFirst({
      where: {
        reference: { equals: cleanRef, mode: 'insensitive' },
        guest: { email: { equals: cleanEmail, mode: 'insensitive' } },
      },
      include: {
        guest: { select: { id: true, name: true, email: true, phone: true } },
        room: { select: { id: true, number: true, type: true, baseRate: true, photos: true } },
        payments: {
          where: { status: 'COMPLETED' },
          select: { id: true, amount: true, method: true, createdAt: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'No reservation found matching that Reference and Email.' },
        { status: 404 }
      );
    }

    // Calculate total paid & balance owing
    const totalAmount = Number(booking.totalAmount);
    const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceOwing = Math.max(0, Number((totalAmount - totalPaid).toFixed(2)));

    return NextResponse.json({
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        source: booking.source,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        totalAmount,
        totalPaid: Number(totalPaid.toFixed(2)),
        balanceOwing,
        notes: booking.notes,
        createdAt: booking.createdAt.toISOString(),
        guest: booking.guest,
        room: booking.room,
        payments: booking.payments,
      },
    });
  } catch (error) {
    console.error('POST /api/public/manage-booking/lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
