import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@hotel/db/src/availability';

/**
 * POST /api/public/manage-booking/cancel
 * Public guest self-service reservation cancellation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, reference, email } = body;

    if (!bookingId || !reference || !email) {
      return NextResponse.json(
        { error: 'Missing required cancellation verification parameters.' },
        { status: 400 }
      );
    }

    const cleanRef = reference.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Verify booking matches ID, reference, and email
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        reference: { equals: cleanRef, mode: 'insensitive' },
        guest: { email: { equals: cleanEmail, mode: 'insensitive' } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reservation verification failed. Could not cancel booking.' },
        { status: 404 }
      );
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'This reservation is already cancelled.' },
        { status: 400 }
      );
    }

    if (booking.status === 'CHECKED_IN' || booking.status === 'CHECKED_OUT') {
      return NextResponse.json(
        { error: `Cannot cancel a reservation with status ${booking.status}.` },
        { status: 400 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: {
        guest: { select: { name: true, email: true } },
        room: { select: { number: true, type: true } },
      },
    });

    return NextResponse.json({
      message: `Reservation ${updatedBooking.reference} has been successfully cancelled.`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('POST /api/public/manage-booking/cancel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
