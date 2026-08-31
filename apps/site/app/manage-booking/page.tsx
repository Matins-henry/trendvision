'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { formatNaira } from '@/lib/currency';

interface BookingDetails {
  id: string;
  reference: string;
  status: string;
  source: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  totalPaid: number;
  balanceOwing: number;
  notes: string | null;
  createdAt: string;
  guest: { name: string; email: string | null; phone: string | null };
  room: { number: string; type: string; baseRate: number };
  payments: Array<{ id: string; amount: number; method: string; createdAt: string }>;
}

export default function ManageBookingPage() {
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setBooking(null);

    if (!reference.trim() || !email.trim()) {
      setErrorMsg('Both Booking Reference and Guest Email Address are required.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/public/manage-booking/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No reservation found matching these details');
      }

      setBooking(data.booking);
    } catch (err: any) {
      console.error('Lookup error:', err);
      setErrorMsg(err.message || 'Failed to find reservation');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!booking) return;

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel reservation ${booking.reference}? This action cannot be undone.`
    );
    if (!confirmCancel) return;

    try {
      setCancelling(true);
      setErrorMsg('');
      const res = await fetch('/api/public/manage-booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          reference: booking.reference,
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel reservation');
      }

      setSuccessMsg(data.message || 'Reservation cancelled successfully.');
      setBooking((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
    } catch (err: any) {
      console.error('Cancel error:', err);
      setErrorMsg(err.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tv-bg)', color: 'var(--tv-text)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '3.5rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem' }}>
            <span className="tv-label">GUEST SELF-SERVICE PORTAL</span>
            <h1 className="tv-section-title" style={{ marginTop: '0.35rem' }}>
              Manage Your Reservation
            </h1>
            <div className="tv-divider-gold"><span>❖</span></div>
            <p className="tv-section-subtitle" style={{ marginTop: '1rem' }}>
              Enter your booking reference code and registered email to view stay details or cancel a reservation.
            </p>
          </div>

          {/* Lookup Form Card */}
          <div className="tv-card" style={{ padding: '2.5rem 2rem', marginBottom: '2.5rem' }}>
            <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tv-forest)', marginBottom: '0.4rem' }}>
                    Booking Reference Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. TVL-2026-0001"
                    className="tv-input"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tv-forest)', marginBottom: '0.4rem' }}>
                    Guest Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="tv-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tv-btn tv-btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '0.82rem', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Finding Reservation...' : '🔍 Find My Booking'}
              </button>
            </form>
          </div>

          {errorMsg && (
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius)', color: 'var(--tv-danger)', textAlign: 'center', fontSize: '0.85rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--tv-success-pale)', border: '1px solid var(--tv-success)', borderRadius: 'var(--tv-radius)', color: 'var(--tv-success)', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700' }}>
              ✓ {successMsg}
            </div>
          )}

          {/* Results Card & Print Template */}
          {booking && (
            <>
              {/* Screen Version */}
              <div className="tv-card" style={{ padding: '2.5rem 2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--tv-border-md)', paddingBottom: '1.25rem' }}>
                  <img src="/logo.png" alt="Trend Vision LTD" style={{ height: '54px', margin: '0 auto 0.75rem', display: 'block' }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8A97E' }}>
                    RESERVATION CONFIRMATION RECEIPT
                  </span>
                </div>

                {/* Header Info */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--tv-border-md)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span className="tv-badge-forest" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
                      Reference: {booking.reference}
                    </span>
                    <h2 className="tv-serif" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--tv-text)', marginTop: '0.2rem' }}>
                      {booking.guest.name}
                    </h2>
                  </div>

                  <div>
                    <span className="tv-badge-pill" style={{
                      fontSize: '0.75rem', padding: '0.35rem 0.875rem',
                      background: booking.status === 'CONFIRMED' ? 'var(--tv-forest-pale)' : booking.status === 'CHECKED_IN' ? 'var(--tv-success-pale)' : 'var(--tv-bg-raised)',
                      color: booking.status === 'CONFIRMED' ? 'var(--tv-forest)' : booking.status === 'CHECKED_IN' ? 'var(--tv-success)' : 'var(--tv-text-muted)',
                      border: '1px solid var(--tv-border-md)',
                    }}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Grid Info */}
                <div className="tv-booking-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                  <div style={{ background: 'var(--tv-bg-input)', padding: '1rem', borderRadius: '0.625rem', border: '1px solid var(--tv-border-md)' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>Assigned Suite</span>
                    <p style={{ fontWeight: '700', color: 'var(--tv-text)', fontSize: '0.95rem', marginTop: '0.2rem', fontFamily: 'Playfair Display, serif' }}>
                      Room {booking.room.number} ({booking.room.type})
                    </p>
                  </div>

                  <div style={{ background: 'var(--tv-bg-input)', padding: '1rem', borderRadius: '0.625rem', border: '1px solid var(--tv-border-md)' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>Check-In Date</span>
                    <p style={{ fontWeight: '700', color: 'var(--tv-text)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                      {new Date(booking.checkIn).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ background: 'var(--tv-bg-input)', padding: '1rem', borderRadius: '0.625rem', border: '1px solid var(--tv-border-md)' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>Check-Out Date</span>
                    <p style={{ fontWeight: '700', color: 'var(--tv-text)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                      {new Date(booking.checkOut).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ background: 'var(--tv-bg-input)', padding: '1rem', borderRadius: '0.625rem', border: '1px solid var(--tv-border-md)' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>Balance Owing</span>
                    <p style={{ fontWeight: '700', fontSize: '0.95rem', marginTop: '0.2rem', color: booking.balanceOwing > 0 ? 'var(--tv-gold-dark)' : 'var(--tv-success)' }}>
                      {formatNaira(booking.balanceOwing)} {booking.balanceOwing === 0 ? '✓ Paid' : ''}
                    </p>
                  </div>
                </div>

                {/* Export PDF Confirmation & Cancellation Actions */}
                <div className="tv-pdf-action-row" style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--tv-border-md)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.7rem 1.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#1C1917',
                      backgroundColor: '#C8A97E',
                      border: '1px solid #BE9B6B',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(200,169,126,0.25)',
                    }}
                  >
                    📄 Export / Download PDF Receipt
                  </button>

                  {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                    <button
                      disabled={cancelling}
                      onClick={handleCancel}
                      className="tv-btn tv-btn-ghost"
                      style={{ padding: '0.5rem 1.125rem', fontSize: '0.75rem', color: 'var(--tv-danger)', borderColor: 'var(--tv-danger-pale)' }}
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
                    </button>
                  )}
                </div>
              </div>

              {/* Dedicated Print / PDF Template */}
              <div id="booking-print-area">
                <div className="print-logo-header">
                  <img src="/logo.png" alt="Trend Vision LTD" className="print-logo-img" />
                  <span className="print-brand-name">TREND VISION LTD</span>
                  <span className="print-brand-sub">CONSTRUCTION • REAL ESTATE • DEVELOPERS • LUXURY APARTMENTS</span>
                </div>

                <h2 className="print-title">RESERVATION CONFIRMATION RECEIPT</h2>
                <p className="print-subtitle">Reference Code: <strong>{booking.reference}</strong> — Issued on {new Date().toLocaleDateString()}</p>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E7DFD5' }}>
                      <td style={{ padding: '0.6rem 0', fontWeight: '700', width: '35%', color: '#44403C' }}>Guest Name:</td>
                      <td style={{ padding: '0.6rem 0', color: '#1C1917', fontWeight: '600' }}>{booking.guest.name}</td>
                    </tr>
                    {booking.guest.email && (
                      <tr style={{ borderBottom: '1px solid #E7DFD5' }}>
                        <td style={{ padding: '0.6rem 0', fontWeight: '700', color: '#44403C' }}>Email Address:</td>
                        <td style={{ padding: '0.6rem 0', color: '#1C1917' }}>{booking.guest.email}</td>
                      </tr>
                    )}
                    {booking.guest.phone && (
                      <tr style={{ borderBottom: '1px solid #E7DFD5' }}>
                        <td style={{ padding: '0.6rem 0', fontWeight: '700', color: '#44403C' }}>Phone Number:</td>
                        <td style={{ padding: '0.6rem 0', color: '#1C1917' }}>{booking.guest.phone}</td>
                      </tr>
                    )}
                    <tr style={{ borderBottom: '1px solid #E7DFD5' }}>
                      <td style={{ padding: '0.6rem 0', fontWeight: '700', color: '#44403C' }}>Reserved Suite:</td>
                      <td style={{ padding: '0.6rem 0', color: '#1C1917', fontWeight: '600' }}>Room {booking.room.number} ({booking.room.type})</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E7DFD5' }}>
                      <td style={{ padding: '0.6rem 0', fontWeight: '700', color: '#44403C' }}>Check-In Date:</td>
                      <td style={{ padding: '0.6rem 0', color: '#1C1917' }}>{new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E7DFD5' }}>
                      <td style={{ padding: '0.6rem 0', fontWeight: '700', color: '#44403C' }}>Check-Out Date:</td>
                      <td style={{ padding: '0.6rem 0', color: '#1C1917' }}>{new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E7DFD5' }}>
                      <td style={{ padding: '0.6rem 0', fontWeight: '700', color: '#44403C' }}>Reservation Status:</td>
                      <td style={{ padding: '0.6rem 0', color: '#059669', fontWeight: '700' }}>{booking.status}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E7DFD5' }}>
                      <td style={{ padding: '0.6rem 0', fontWeight: '700', color: '#44403C' }}>Total Amount:</td>
                      <td style={{ padding: '0.6rem 0', color: '#1C1917', fontWeight: '700' }}>{formatNaira(booking.totalAmount)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E7DFD5' }}>
                      <td style={{ padding: '0.6rem 0', fontWeight: '700', color: '#44403C' }}>Total Paid:</td>
                      <td style={{ padding: '0.6rem 0', color: '#059669', fontWeight: '700' }}>{formatNaira(booking.totalPaid)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.6rem 0', fontWeight: '700', color: '#44403C' }}>Balance Remaining:</td>
                      <td style={{ padding: '0.6rem 0', color: booking.balanceOwing > 0 ? '#C8A97E' : '#059669', fontWeight: '700' }}>{formatNaira(booking.balanceOwing)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="print-footer-note">
                  Thank you for choosing Trend Vision Luxury Apartments. For inquiries or adjustments, please contact our reception management.
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
