import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma, isRoomAvailable, calculateBookingTotal } from '@hotel/db/src/index';

/**
 * GET /api/bookings/[id] - Fetch booking details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        room: true,
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('GET /api/bookings/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/bookings/[id] - Update booking (dates, room, notes)
 * Allowed roles: RECEPTIONIST, MANAGER (403 for OWNER)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (existingBooking.status === 'CANCELLED' || existingBooking.status === 'CHECKED_OUT') {
      return NextResponse.json(
        { error: `Cannot edit a booking with status ${existingBooking.status}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { roomId, checkIn, checkOut, notes } = body;

    const targetRoomId = roomId || existingBooking.roomId;
    const checkInDate = checkIn ? new Date(checkIn) : new Date(existingBooking.checkIn);
    const checkOutDate = checkOut ? new Date(checkOut) : new Date(existingBooking.checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'Invalid check-in or check-out date format' }, { status: 400 });
    }

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-in date must be strictly before check-out date' },
        { status: 400 }
      );
    }

    // Verify room
    const room = await prisma.room.findUnique({
      where: { id: targetRoomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Room ${room.number} is currently ${room.status}` },
        { status: 400 }
      );
    }

    // Check availability passing self-exclusion (existingBooking.id)
    const available = await isRoomAvailable(targetRoomId, checkInDate, checkOutDate, existingBooking.id);
    if (!available) {
      return NextResponse.json(
        { error: `Room ${room.number} is not available for the updated date range.` },
        { status: 400 }
      );
    }

    // Recalculate price
    const totalAmount = calculateBookingTotal(checkInDate, checkOutDate, Number(room.baseRate));

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        roomId: targetRoomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalAmount,
        notes: notes !== undefined ? (notes?.trim() || null) : existingBooking.notes,
      },
      include: {
        guest: { select: { id: true, name: true, email: true, phone: true } },
        room: { select: { id: true, number: true, type: true, baseRate: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error('PUT /api/bookings/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
