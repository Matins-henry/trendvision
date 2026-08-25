/**
 * Automated Guest Email Notification System
 * Trend Vision Hotel & Luxury Residences
 */

export interface BookingConfirmationEmailParams {
  guestName: string;
  guestEmail: string;
  reference: string;
  roomNumber: string;
  roomType: string;
  checkIn: string | Date;
  checkOut: string | Date;
  totalAmount: number;
  notes?: string | null;
}

export interface PaymentReceiptEmailParams {
  guestName: string;
  guestEmail: string;
  reference: string;
  amountPaid: number;
  paymentMethod: string;
  totalAmount: number;
  balanceOwing: number;
  paymentDate?: string | Date;
}

export interface PreArrivalReminderEmailParams {
  guestName: string;
  guestEmail: string;
  reference: string;
  roomNumber: string;
  roomType: string;
  checkIn: string | Date;
}

const HOTEL_NAME = process.env.NEXT_PUBLIC_HOTEL_NAME || 'Trend Vision Hotel & Luxury Residences';
const HOTEL_EMAIL = process.env.HOTEL_CONTACT_EMAIL || 'reservations@trendvisionhotel.com';

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Sends email via Resend / SendGrid / Custom Webhook if configured,
 * or logs full HTML payload to console in Development mode.
 */
async function dispatchEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${HOTEL_NAME} <${HOTEL_EMAIL}>`,
          to: [to],
          subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        console.log(`✉️ [Resend API] Email successfully delivered to ${to}`);
        return true;
      }
      const errData = await res.json();
      console.warn('⚠️ [Resend API Warning]:', errData);
    } catch (err) {
      console.error('❌ Resend API Dispatch Error:', err);
    }
  }

  if (sendgridApiKey) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: HOTEL_EMAIL, name: HOTEL_NAME },
          subject,
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });

      if (res.ok) {
        console.log(`✉️ [SendGrid API] Email successfully delivered to ${to}`);
        return true;
      }
    } catch (err) {
      console.error('❌ SendGrid API Dispatch Error:', err);
    }
  }

  // Fallback Logger Mode for Local Dev / Sandbox
  console.log(`
════════════════════════════════════════════════════════════════════════════════
✉️ [TREND VISION EMAIL DISPATCHER - DEV LOG]
To: ${to}
Subject: ${subject}
Sender: ${HOTEL_NAME} <${HOTEL_EMAIL}>
Timestamp: ${new Date().toISOString()}
────────────────────────────────────────────────────────────────────────────────
${htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 300)}...
════════════════════════════════════════════════════════════════════════════════
`);

  return true;
}

/**
 * 1. Send Booking Confirmation Email
 */
export async function sendBookingConfirmationEmail(params: BookingConfirmationEmailParams): Promise<boolean> {
  const { guestName, guestEmail, reference, roomNumber, roomType, checkIn, checkOut, totalAmount, notes } = params;

  if (!guestEmail) return false;

  const subject = `Booking Confirmation: ${reference} – ${HOTEL_NAME}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #FAF8F3; color: #2C1810; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5DECF; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .header { background-color: #0B0F19; padding: 30px; text-align: center; border-bottom: 3px solid #D4AF37; }
    .logo { color: #D4AF37; font-family: Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
    .subtitle { color: #A07D50; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 5px; }
    .body { padding: 35px 30px; }
    .greeting { font-family: Georgia, serif; font-size: 22px; color: #0B0F19; margin-bottom: 15px; }
    .card { background-color: #FDFBF7; border: 1px solid #EAE3D2; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .ref-badge { display: inline-block; background-color: #0B0F19; color: #D4AF37; font-weight: bold; padding: 6px 16px; border-radius: 20px; font-size: 14px; letter-spacing: 1px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F0E9D8; font-size: 14px; }
    .label { color: #7A6B5D; font-weight: 500; }
    .val { color: #2C1810; font-weight: bold; text-align: right; }
    .total-box { background: #0B0F19; color: #FFFFFF; padding: 15px 20px; border-radius: 8px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; }
    .total-amount { color: #D4AF37; font-family: Georgia, serif; font-size: 20px; font-weight: bold; }
    .footer { background-color: #0B0F19; color: #A07D50; padding: 25px; text-align: center; font-size: 12px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TREND VISION</div>
      <div class="subtitle">Hotel & Luxury Residences</div>
    </div>
    
    <div class="body">
      <div class="greeting">Reservation Confirmed</div>
      <p style="color: #4A3728; line-height: 1.6; font-size: 15px;">
        Dear <strong>${guestName}</strong>,<br>
        Thank you for choosing Trend Vision Hotel. We are delighted to confirm your upcoming luxury suite reservation.
      </p>

      <div style="text-align: center; margin: 25px 0;">
        <span class="ref-badge">BOOKING REF: ${reference}</span>
      </div>

      <div class="card">
        <div class="row">
          <span class="label">Suite Category</span>
          <span class="val">${roomType} (Room ${roomNumber})</span>
        </div>
        <div class="row">
          <span class="label">Check-In Date</span>
          <span class="val">${formatDate(checkIn)} (3:00 PM)</span>
        </div>
        <div class="row">
          <span class="label">Check-Out Date</span>
          <span class="val">${formatDate(checkOut)} (11:00 AM)</span>
        </div>
        ${notes ? `<div class="row"><span class="label">Special Requests</span><span class="val">${notes}</span></div>` : ''}

        <div class="total-box">
          <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Total Stay Amount</span>
          <span class="total-amount">${formatNaira(totalAmount)}</span>
        </div>
      </div>

      <p style="color: #7A6B5D; font-size: 13px; line-height: 1.6; text-align: center;">
        Standard check-in begins at 3:00 PM. Please bring a valid photo ID upon arrival. Our 24/7 concierge team awaits to welcome you.
      </p>
    </div>

    <div class="footer">
      <strong>TREND VISION HOTEL & LUXURY RESIDENCES</strong><br>
      Plot 14, Victoria Island Executive Precinct, Lagos, Nigeria<br>
      Tel: +234 800 873 6384 | Email: ${HOTEL_EMAIL}
    </div>
  </div>
</body>
</html>
`;

  return dispatchEmail(guestEmail, subject, htmlContent);
}

/**
 * 2. Send Payment Receipt Email
 */
export async function sendPaymentReceiptEmail(params: PaymentReceiptEmailParams): Promise<boolean> {
  const { guestName, guestEmail, reference, amountPaid, paymentMethod, totalAmount, balanceOwing, paymentDate } = params;

  if (!guestEmail) return false;

  const subject = `Official Payment Receipt: ${reference} – ${HOTEL_NAME}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #FAF8F3; color: #2C1810; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5DECF; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .header { background-color: #0B0F19; padding: 30px; text-align: center; border-bottom: 3px solid #D4AF37; }
    .logo { color: #D4AF37; font-family: Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
    .subtitle { color: #A07D50; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 5px; }
    .body { padding: 35px 30px; }
    .greeting { font-family: Georgia, serif; font-size: 22px; color: #0B0F19; margin-bottom: 15px; }
    .card { background-color: #FDFBF7; border: 1px solid #EAE3D2; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F0E9D8; font-size: 14px; }
    .label { color: #7A6B5D; font-weight: 500; }
    .val { color: #2C1810; font-weight: bold; text-align: right; }
    .badge-paid { background-color: #059669; color: #FFFFFF; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
    .footer { background-color: #0B0F19; color: #A07D50; padding: 25px; text-align: center; font-size: 12px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TREND VISION</div>
      <div class="subtitle">Official Payment Receipt</div>
    </div>
    
    <div class="body">
      <div class="greeting">Payment Received</div>
      <p style="color: #4A3728; line-height: 1.6; font-size: 15px;">
        Dear <strong>${guestName}</strong>,<br>
        We have successfully received your payment for reservation <strong>${reference}</strong>.
      </p>

      <div class="card">
        <div class="row">
          <span class="label">Payment Date</span>
          <span class="val">${formatDate(paymentDate || new Date())}</span>
        </div>
        <div class="row">
          <span class="label">Payment Channel</span>
          <span class="val">${paymentMethod}</span>
        </div>
        <div class="row">
          <span class="label">Amount Paid</span>
          <span class="val" style="color: #059669; font-size: 16px;">${formatNaira(amountPaid)} <span class="badge-paid">COMPLETED</span></span>
        </div>
        <div class="row">
          <span class="label">Total Stay Cost</span>
          <span class="val">${formatNaira(totalAmount)}</span>
        </div>
        <div class="row">
          <span class="label">Balance Owing</span>
          <span class="val" style="color: ${balanceOwing > 0 ? '#DC2626' : '#059669'}">${formatNaira(balanceOwing)}</span>
        </div>
      </div>

      <p style="color: #7A6B5D; font-size: 13px; line-height: 1.6; text-align: center;">
        Thank you for your business. Your payment ledger has been updated in our hotel management system.
      </p>
    </div>

    <div class="footer">
      <strong>TREND VISION HOTEL & LUXURY RESIDENCES</strong><br>
      Tel: +234 800 873 6384 | Email: ${HOTEL_EMAIL}
    </div>
  </div>
</body>
</html>
`;

  return dispatchEmail(guestEmail, subject, htmlContent);
}

/**
 * 3. Send Pre-Arrival Reminder Email
 */
export async function sendPreArrivalReminderEmail(params: PreArrivalReminderEmailParams): Promise<boolean> {
  const { guestName, guestEmail, reference, roomNumber, roomType, checkIn } = params;

  if (!guestEmail) return false;

  const subject = `Your Stay Starts Tomorrow: ${reference} – ${HOTEL_NAME}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #FAF8F3; color: #2C1810; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5DECF; }
    .header { background-color: #0B0F19; padding: 30px; text-align: center; border-bottom: 3px solid #D4AF37; }
    .logo { color: #D4AF37; font-family: Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
    .body { padding: 35px 30px; }
    .greeting { font-family: Georgia, serif; font-size: 22px; color: #0B0F19; margin-bottom: 15px; }
    .footer { background-color: #0B0F19; color: #A07D50; padding: 25px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TREND VISION</div>
    </div>
    
    <div class="body">
      <div class="greeting">We Look Forward to Your Arrival</div>
      <p style="color: #4A3728; line-height: 1.6;">
        Dear <strong>${guestName}</strong>,<br>
        Your luxury stay at Trend Vision Hotel begins tomorrow, <strong>${formatDate(checkIn)}</strong>.
      </p>

      <p style="color: #4A3728; line-height: 1.6;">
        Your suite category: <strong>${roomType} (Room ${roomNumber})</strong><br>
        Reservation Reference: <strong>${reference}</strong>
      </p>

      <p style="color: #7A6B5D; font-size: 13px; line-height: 1.6;">
        If you require airport executive transfer or early check-in assistance, please contact our concierge desk. Safe travels!
      </p>
    </div>

    <div class="footer">
      <strong>TREND VISION HOTEL & LUXURY RESIDENCES</strong><br>
      Tel: +234 800 873 6384 | Email: ${HOTEL_EMAIL}
    </div>
  </div>
</body>
</html>
`;

  return dispatchEmail(guestEmail, subject, htmlContent);
}
