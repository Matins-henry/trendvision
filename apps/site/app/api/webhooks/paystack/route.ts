import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@hotel/db/src/availability';

/**
 * POST /api/webhooks/paystack
 * Webhook handler for Paystack event notifications (e.g. charge.success).
 */
export async function POST(request: NextRequest) {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const bodyText = await request.text();

    if (paystackSecret) {
      const signature = request.headers.get('x-paystack-signature');
      const hash = crypto.createHmac('sha512', paystackSecret).update(bodyText).digest('hex');

      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      const reference = data.reference;
      const metadata = data.metadata || {};
      const bookingId = metadata.bookingId || metadata.booking_id;

      if (bookingId) {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking && booking.status !== 'CONFIRMED') {
          // Check if payment already exists
          const existingPayment = await prisma.payment.findFirst({
            where: { bookingId: booking.id, method: 'ONLINE' },
          });

          if (!existingPayment) {
            await prisma.payment.create({
              data: {
                bookingId: booking.id,
                amount: booking.totalAmount,
                method: 'ONLINE',
                status: 'COMPLETED',
                receiptUrl: reference,
              },
            });
          }

          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'CONFIRMED' },
          });
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
