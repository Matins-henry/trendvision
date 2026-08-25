import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma, isRoomAvailable, generateBookingReference, calculateBookingTotal, sendBookingConfirmationEmail } from '@hotel/db/src/index';

/**
 * GET /api/bookings - List bookings with filtering & summary stats
 * Allowed roles: RECEPTIONIST, MANAGER, OWNER
 */
export async function GET(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status')?.trim();
    const searchQuery = searchParams.get('search')?.trim();

    // Build Prisma query condition
    const whereConditions: any[] = [];

    if (statusFilter && statusFilter !== 'ALL') {
      whereConditions.push({ status: statusFilter });
    }

    if (searchQuery) {
      whereConditions.push({
        OR: [
          { reference: { contains: searchQuery, mode: 'insensitive' } },
          { guest: { name: { contains: searchQuery, mode: 'insensitive' } } },
          { guest: { email: { contains: searchQuery, mode: 'insensitive' } } },
          { room: { number: { contains: searchQuery, mode: 'insensitive' } } },
        ],
      });
    }

    const whereClause = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [bookings, totalCount, confirmedCount, checkedInCount, checkedOutCount, cancelledCount] =
      await Promise.all([
        prisma.booking.findMany({
          where: whereClause,
          include: {
            guest: { select: { id: true, name: true, email: true, phone: true } },
            room: { select: { id: true, number: true, type: true, baseRate: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { checkIn: 'desc' },
        }),
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { status: 'CHECKED_IN' } }),
        prisma.booking.count({ where: { status: 'CHECKED_OUT' } }),
        prisma.booking.count({ where: { status: 'CANCELLED' } }),
      ]);

    // Calculate total revenue from active/completed stays
    const revenueAgg = await prisma.booking.aggregate({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
      },
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      bookings,
      stats: {
        total: totalCount,
        confirmed: confirmedCount,
        checkedIn: checkedInCount,
        checkedOut: checkedOutCount,
        cancelled: cancelledCount,
        totalRevenue: revenueAgg._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/bookings - Create new booking
 * Allowed roles: RECEPTIONIST, MANAGER (403 for OWNER)
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { guestId, roomId, checkIn, checkOut, notes } = body;

    if (!guestId || !roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required booking fields (guestId, roomId, checkIn, checkOut)' },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'Invalid check-in or check-out date format' }, { status: 400 });
    }

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-in date must be strictly before check-out date' },
        { status: 400 }
      );
    }

    // Verify room exists and fetch baseRate
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Room ${room.number} is currently ${room.status} and cannot be booked.` },
        { status: 400 }
      );
    }

    // Check room availability
    const available = await isRoomAvailable(roomId, checkInDate, checkOutDate);
    if (!available) {
      return NextResponse.json(
        { error: `Room ${room.number} is not available for the selected date range.` },
        { status: 400 }
      );
    }

    // Verify guest exists
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    // Calculate total price server-side
    const totalAmount = calculateBookingTotal(checkInDate, checkOutDate, Number(room.baseRate));
    const reference = await generateBookingReference(prisma);

    const booking = await prisma.booking.create({
      data: {
        reference,
        guestId,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: 'CONFIRMED',
        source: 'STAFF',
        totalAmount,
        notes: notes?.trim() || null,
        createdById: staff.staffUserId,
      },
      include: {
        guest: { select: { id: true, name: true, email: true, phone: true } },
        room: { select: { id: true, number: true, type: true, baseRate: true } },
        createdBy: { select: { id: true, name: true } },
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
      }).catch((err) => console.error('Staff booking confirmation email error:', err));
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
