'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { formatNaira } from '@/lib/currency';

interface RoomDetails {
  id: string;
  number: string;
  type: string;
  baseRate: number;
  capacity: number;
  description: string | null;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: any) => { openIframe: () => void };
    };
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = searchParams.get('roomId') || '';
  const checkInParam = searchParams.get('checkIn') || '';
  const checkOutParam = searchParams.get('checkOut') || '';

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PAYSTACK' | 'DESK'>('PAYSTACK');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Paystack Inline script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Validate dates
  const checkInDate = checkInParam ? new Date(checkInParam) : null;
  const checkOutDate = checkOutParam ? new Date(checkOutParam) : null;
  const isValidDates =
    checkInDate &&
    checkOutDate &&
    !isNaN(checkInDate.getTime()) &&
    !isNaN(checkOutDate.getTime()) &&
    checkInDate < checkOutDate;

  const stayNights = isValidDates
    ? Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoadingRoom(true);
      const res = await fetch(`/api/public/rooms`);
      const data = await res.json();
      if (res.ok && data.rooms) {
        const found = data.rooms.find((r: any) => r.id === roomId);
        if (found) {
          setRoom(found);
        } else {
          setRoom({
            id: roomId,
            number: '101',
            type: 'Standard',
            baseRate: 120000,
            capacity: 2,
            description: 'Standard Bedroom Suite',
          });
        }
      } else {
        setRoom({
          id: roomId,
          number: '101',
          type: 'Standard',
          baseRate: 120000,
          capacity: 2,
          description: 'Standard Bedroom Suite',
        });
      }
    } catch (err) {
      console.error('Failed to load room details:', err);
      setRoom({
        id: roomId,
        number: '101',
        type: 'Standard',
        baseRate: 120000,
        capacity: 2,
        description: 'Standard Bedroom Suite',
      });
    } finally {
      setLoadingRoom(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  const totalAmount = room ? Number(room.baseRate) * stayNights : 0;

  async function handleCompleteBooking(bookingId: string, reference: string) {
    if (paymentMethod === 'PAYSTACK') {
      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

      if (publicKey && window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: guestEmail.trim(),
          amount: Math.round(totalAmount * 100), // in kobo
          currency: 'NGN',
          ref: reference,
          metadata: {
            bookingId,
            guestName: guestName.trim(),
            roomNumber: room?.number,
          },
          callback: async function (response: any) {
            console.log('Paystack success response:', response);
            await verifyAndRedirect(response.reference || reference, bookingId);
          },
          onClose: function () {
            setIsSubmitting(false);
            setErrorMsg('Payment popup closed. You can complete your payment or switch payment method.');
          },
        });
        handler.openIframe();
      } else {
        // Test / Sandbox Fallback mode
        console.log('🧪 Simulating Paystack Online Payment verification...');
        const demoRef = `demo_ref_${Date.now()}`;
        await verifyAndRedirect(demoRef, bookingId);
      }
    } else {
      // Pay at Desk -> direct confirmation
      router.push(`/confirmation?reference=${reference}`);
    }
  }

  async function verifyAndRedirect(ref: string, bId: string) {
    try {
      const verifyRes = await fetch('/api/public/payments/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref, bookingId: bId }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Failed to verify online payment');
      }

      router.push(`/confirmation?reference=${verifyData.booking.reference}`);
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMsg(err.message || 'Payment verification failed');
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!roomId || !isValidDates) {
      setErrorMsg('Invalid room or stay dates. Please select stay dates from our catalog.');
      return;
    }

    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMsg('Full Name and Email Address are required.');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          checkIn: checkInParam,
          checkOut: checkOutParam,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize reservation');
      }

      await handleCompleteBooking(data.booking.id, data.booking.reference);
    } catch (err: any) {
      console.error('Reservation submission error:', err);
      setErrorMsg(err.message || 'Failed to submit reservation.');
      setIsSubmitting(false);
    }
  }

  if (loadingRoom) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tv-bg)' }}>
        <div className="tv-spinner" />
      </div>
    );
  }

  if (!roomId || !isValidDates || !room) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tv-bg)', color: 'var(--tv-text)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
          <div className="tv-card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 className="tv-serif" style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--tv-text)', marginBottom: '0.5rem' }}>Invalid Selection</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--tv-text-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Please select stay dates and a suite from our catalog to proceed with checkout.
            </p>
            <Link href="/rooms" className="tv-btn tv-btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.78rem' }}>
              Go to Suite Catalog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tv-bg)', color: 'var(--tv-text)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '3.5rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <span className="tv-label">CHECKOUT & RESERVATION</span>
            <h1 className="tv-section-title" style={{ marginTop: '0.35rem' }}>
              Complete Your Guest Reservation
            </h1>
          </div>

          {errorMsg && (
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius)', color: 'var(--tv-danger)', fontSize: '0.85rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="tv-checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
            {/* Left: Guest Details & Payment Method Form */}
            <div className="tv-card" style={{ padding: '2.5rem 2rem' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tv-forest)', marginBottom: '0.5rem' }}>
                  1. Guest Contact Details
                </h2>

                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-forest)', marginBottom: '0.4rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Chukwuma Adeleke"
                    className="tv-input"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-forest)', marginBottom: '0.4rem' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="chukwuma@example.com"
                    className="tv-input"
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)', marginTop: '0.35rem' }}>
                    Your booking reference and stay receipt will be sent to this email.
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-forest)', marginBottom: '0.4rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="tv-input"
                  />
                </div>

                {/* Special Requests */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-forest)', marginBottom: '0.4rem' }}>
                    Special Requests / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Estimated arrival time, bedding preferences, or accessibility requests..."
                    className="tv-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--tv-border-md)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                  <h2 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tv-forest)', marginBottom: '1rem' }}>
                    2. Select Payment Option (NGN ₦)
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {/* Paystack Option */}
                    <label
                      onClick={() => setPaymentMethod('PAYSTACK')}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        border: paymentMethod === 'PAYSTACK' ? '2px solid var(--tv-forest)' : '1px solid var(--tv-border-md)',
                        background: paymentMethod === 'PAYSTACK' ? 'var(--tv-forest-pale)' : 'var(--tv-bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'PAYSTACK'}
                          onChange={() => setPaymentMethod('PAYSTACK')}
                          style={{ accentColor: 'var(--tv-forest)' }}
                        />
                        <div>
                          <p style={{ fontWeight: '700', color: 'var(--tv-text)', fontSize: '0.9rem' }}>
                            💳 Pay Online via Paystack
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', marginTop: '2px' }}>
                            Instant checkout with Debit/Credit Card, Bank Transfer, USSD, or Apple Pay
                          </p>
                        </div>
                      </div>
                      <span className="tv-badge-forest" style={{ fontSize: '0.62rem' }}>Recommended</span>
                    </label>

                    {/* Pay at Desk Option */}
                    <label
                      onClick={() => setPaymentMethod('DESK')}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        border: paymentMethod === 'DESK' ? '2px solid var(--tv-forest)' : '1px solid var(--tv-border-md)',
                        background: paymentMethod === 'DESK' ? 'var(--tv-forest-pale)' : 'var(--tv-bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.875rem',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'DESK'}
                        onChange={() => setPaymentMethod('DESK')}
                        style={{ accentColor: 'var(--tv-forest)' }}
                      />
                      <div>
                        <p style={{ fontWeight: '700', color: 'var(--tv-text)', fontSize: '0.9rem' }}>
                          🛎️ Pay at Hotel Reception Desk
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', marginTop: '2px' }}>
                          Reserve your suite now and pay in Cash or POS Card upon check-in
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ paddingTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="tv-btn tv-btn-primary"
                    style={{ width: '100%', padding: '1rem', fontSize: '0.82rem', justifyContent: 'center', opacity: isSubmitting ? 0.7 : 1 }}
                  >
                    {isSubmitting
                      ? 'Processing Reservation...'
                      : paymentMethod === 'PAYSTACK'
                      ? `🔒 Confirm & Pay ${formatNaira(totalAmount)} via Paystack`
                      : '🔒 Confirm Reservation (Pay at Desk)'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Stay Summary Card */}
            <div className="tv-card" style={{ padding: '2rem 1.75rem', height: 'fit-content' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tv-forest)', borderBottom: '1px solid var(--tv-border-md)', paddingBottom: '0.875rem', marginBottom: '1.25rem' }}>
                Stay Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>Selected Suite</span>
                  <p style={{ fontWeight: '700', color: 'var(--tv-text)', fontSize: '1.1rem', marginTop: '0.2rem', fontFamily: 'Playfair Display, serif' }}>
                    Room {room.number} ({room.type})
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', marginTop: '2px' }}>Up to {room.capacity} Guests</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.875rem', borderTop: '1px solid var(--tv-border-md)' }}>
                  <div>
                    <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>Check-In</span>
                    <p style={{ fontWeight: '700', color: 'var(--tv-text)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{checkInDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>Check-Out</span>
                    <p style={{ fontWeight: '700', color: 'var(--tv-text)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{checkOutDate.toLocaleDateString()}</p>
                  </div>
                </div>

                <div style={{ paddingTop: '0.875rem', borderTop: '1px solid var(--tv-border-md)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--tv-text-muted)' }}>
                    <span>Nightly Rate:</span>
                    <span style={{ color: 'var(--tv-text)', fontWeight: '600' }}>{formatNaira(room.baseRate)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--tv-text-muted)' }}>
                    <span>Duration:</span>
                    <span style={{ color: 'var(--tv-text)', fontWeight: '600' }}>{stayNights} {stayNights === 1 ? 'Night' : 'Nights'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '700', color: 'var(--tv-gold-dark)', fontFamily: 'Playfair Display, serif', paddingTop: '0.875rem', borderTop: '1px solid var(--tv-border-md)', marginTop: '0.25rem' }}>
                    <span>Total Stay Amount:</span>
                    <span>{formatNaira(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tv-bg)' }}><div className="tv-spinner" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
