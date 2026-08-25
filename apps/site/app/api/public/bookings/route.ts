import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  prisma,
  isRoomAvailable,
  generateBookingReference,
  calculateBookingTotal,
  sendBookingConfirmationEmail,
} from '@hotel/db/src/index';

/**
 * POST /api/public/bookings
 * Create a public guest reservation online.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, checkIn, checkOut, guestName, guestEmail, guestPhone, notes } = body;

    // Input validations
    if (!roomId || !checkIn || !checkOut || !guestName || (!guestEmail && !guestPhone)) {
      return NextResponse.json(
        {
          error:
            'Missing required reservation fields (roomId, checkIn, checkOut, guestName, and email or phone)',
        },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid check-in or check-out date format' },
        { status: 400 }
      );
    }

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-in date must be strictly before check-out date' },
        { status: 400 }
      );
    }

    // Verify target room exists and is active
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Room ${room.number} is not available for reservations.` },
        { status: 400 }
      );
    }

    // Evaluate room availability
    const available = await isRoomAvailable(roomId, checkInDate, checkOutDate);
    if (!available) {
      return NextResponse.json(
        { error: `Room ${room.number} is already reserved for the selected date range.` },
        { status: 400 }
      );
    }

    // Guest Deduplication: Look up existing guest by email or phone
    const cleanEmail = guestEmail?.trim().toLowerCase() || null;
    const cleanPhone = guestPhone?.trim() || null;

    let guest = null;
    if (cleanEmail) {
      guest = await prisma.guest.findFirst({ where: { email: cleanEmail } });
    }
    if (!guest && cleanPhone) {
      guest = await prisma.guest.findFirst({ where: { phone: cleanPhone } });
    }

    // Create new Guest record if not found
    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name: guestName.trim(),
          email: cleanEmail,
          phone: cleanPhone,
        },
      });
    }

    // Calculate total price server-side & generate reference
    const totalAmount = calculateBookingTotal(checkInDate, checkOutDate, Number(room.baseRate));
    const reference = await generateBookingReference(prisma);

    const booking = await prisma.booking.create({
      data: {
        reference,
        guestId: guest.id,
        roomId: room.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: 'CONFIRMED',
        source: 'ONLINE',
        totalAmount,
        notes: notes?.trim() || null,
      },
      include: {
        guest: { select: { id: true, name: true, email: true, phone: true } },
        room: { select: { id: true, number: true, type: true, baseRate: true } },
      },
    });

    // Trigger Automated Guest Email Notification asynchronously
    if (booking.guest?.email) {
      sendBookingConfirmationEmail({
        guestName: booking.guest.name,
        guestEmail: booking.guest.email,
        reference: booking.reference,
        roomNumber: booking.room.number,
        roomType: booking.room.type,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalAmount: Number(booking.totalAmount),
        notes: booking.notes,
      }).catch((err) => console.error('Booking confirmation email error:', err));
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('POST /api/public/bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
