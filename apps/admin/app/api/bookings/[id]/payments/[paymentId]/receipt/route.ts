import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';
import { renderToBuffer } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import React from 'react';
import { ReceiptDocument } from '@/components/payments/ReceiptDocument';
import type { DocumentProps } from '@react-pdf/renderer';

/**
 * GET /api/bookings/[id]/payments/[paymentId]/receipt
 * Generate and stream a PDF receipt for a specific payment.
 * Allowed roles: RECEPTIONIST, MANAGER (403 for OWNER)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bookingId, paymentId } = await params;

    // Fetch booking with all related data in a single query
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        guest: { select: { name: true, email: true, phone: true } },
        room: { select: { number: true, type: true } },
        payments: {
          where: { id: paymentId },
          include: {
            handledBy: { select: { name: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const payment = booking.payments[0];
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME ?? 'Hotel';

    const pdfBuffer = await renderToBuffer(
      React.createElement(ReceiptDocument, {
        hotelName,
        booking: {
          reference: booking.reference,
          checkIn: booking.checkIn.toISOString(),
          checkOut: booking.checkOut.toISOString(),
          notes: booking.notes,
        },
        guest: {
          name: booking.guest.name,
          email: booking.guest.email,
          phone: booking.guest.phone,
        },
        room: {
          number: booking.room.number,
          type: booking.room.type,
        },
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          method: payment.method,
          createdAt: payment.createdAt.toISOString(),
        },
        handledBy: payment.handledBy ?? null,
      }) as ReactElement<DocumentProps>
    );

    const filename = `receipt-${booking.reference}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('GET /api/bookings/[id]/payments/[paymentId]/receipt error:', error);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}
