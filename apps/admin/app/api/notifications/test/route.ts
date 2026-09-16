import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { sendBookingConfirmationEmail } from '@hotel/db/src/index';

/**
 * POST /api/notifications/test
 * Sends a sample luxury booking confirmation email to the requested email address.
 * Accessible to MANAGER and OWNER roles.
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'MANAGER' && staff.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const recipientEmail = body.email || staff.email;

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return NextResponse.json({ error: 'Recipient email address is required' }, { status: 400 });
    }

    const success = await sendBookingConfirmationEmail({
      guestName: staff.name,
      guestEmail: recipientEmail,
      reference: 'TVL-2026-TEST',
      roomNumber: '101',
      roomType: 'Deluxe Parlor Suite',
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 3),
      totalAmount: 540000,
      notes: 'Sample test email dispatch triggered from Admin System.',
    });

    return NextResponse.json({
      success: true,
      message: `Sample notification email dispatched to ${recipientEmail}`,
    });
  } catch (error: any) {
    console.error('POST /api/notifications/test error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
