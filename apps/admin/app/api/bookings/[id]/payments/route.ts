import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma, sendPaymentReceiptEmail } from '@hotel/db/src/index';

const VALID_METHODS = ['CASH', 'CARD', 'TRANSFER', 'ONLINE'] as const;

/**
 * GET /api/bookings/[id]/payments
 * List all payments for a booking.
 * Allowed roles: RECEPTIONIST, MANAGER (OWNER blocked — no operational access)
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

    const { id: bookingId } = await params;

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, totalAmount: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const payments = await prisma.payment.findMany({
      where: { bookingId },
      include: {
        handledBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Sum COMPLETED payments only
    const totalPaid = payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalOwed = Number(booking.totalAmount);
    const balanceOwing = Math.max(0, totalOwed - totalPaid);

    return NextResponse.json({
      payments,
      summary: {
        totalAmount: totalOwed,
        totalPaid: Number(totalPaid.toFixed(2)),
        balanceOwing: Number(balanceOwing.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('GET /api/bookings/[id]/payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/bookings/[id]/payments
 * Record a new payment against a booking.
 * Allowed roles: RECEPTIONIST, MANAGER (403 for OWNER)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bookingId } = await params;

    // Verify booking exists and is not cancelled
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, totalAmount: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot record a payment against a cancelled booking.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount, method } = body;

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number.' },
        { status: 400 }
      );
    }

    // Validate max 2 decimal places
    const amountStr = amount.toFixed(10);
    const decimalPart = amountStr.split('.')[1];
    const significantDecimals = decimalPart?.replace(/0+$/, '').length || 0;
    if (significantDecimals > 2) {
      return NextResponse.json(
        { error: 'Amount must have at most 2 decimal places.' },
        { status: 400 }
      );
    }

    // Validate method
    if (!method || !VALID_METHODS.includes(method as typeof VALID_METHODS[number])) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${VALID_METHODS.join(', ')}` },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount,
        method: method as typeof VALID_METHODS[number],
        status: 'COMPLETED',
        handledById: staff.staffUserId,
      },
      include: {
        handledBy: { select: { id: true, name: true } },
        booking: {
          include: {
            guest: true,
            payments: { where: { status: 'COMPLETED' } },
          },
        },
      },
    });

    if (payment.booking?.guest?.email) {
      const totalPaid = payment.booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceOwing = Math.max(0, Number(payment.booking.totalAmount) - totalPaid);

      sendPaymentReceiptEmail({
        guestName: payment.booking.guest.name,
        guestEmail: payment.booking.guest.email,
        reference: payment.booking.reference,
        amountPaid: Number(payment.amount),
        paymentMethod: payment.method,
        totalAmount: Number(payment.booking.totalAmount),
        balanceOwing,
      }).catch((err) => console.error('Staff payment receipt email error:', err));
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings/[id]/payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
