'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tv-bg)', color: 'var(--tv-text)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '4rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          {/* Animated checkmark badge */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--tv-success-pale)',
              border: '2px solid var(--tv-success)',
              color: 'var(--tv-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 1.5rem',
              boxShadow: 'var(--tv-shadow)',
            }}
          >
            ✓
          </div>

          <span className="tv-badge-forest" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
            RESERVATION CONFIRMED
          </span>

          <h1 className="tv-serif" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: '700', color: 'var(--tv-text)', lineHeight: 1.15 }}>
            Thank You For Booking!
          </h1>

          <p style={{ fontSize: '0.92rem', color: 'var(--tv-text-muted)', marginTop: '0.75rem', lineHeight: 1.7, maxWidth: '480px', margin: '0.75rem auto 0' }}>
            Your reservation at Trend Vision Hotel & Luxury Residences has been successfully confirmed.
          </p>

          {/* Reference Card */}
          <div className="tv-card" style={{ padding: '2.5rem 2rem', margin: '2.5rem 0' }}>
            <div style={{ background: 'var(--tv-bg-2)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--tv-border-md)', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tv-forest)' }}>
                Booking Reference Code
              </span>
              <p className="tv-serif" style={{ fontSize: '2.4rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--tv-gold-dark)', marginTop: '0.35rem', lineHeight: 1 }}>
                {reference || 'TV-CONFIRMED'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', marginTop: '0.5rem' }}>
                Save this reference code to check-in or manage your reservation online.
              </p>
            </div>

            <div style={{ textAlign: 'left', fontSize: '0.85rem', background: 'var(--tv-bg-input)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--tv-border-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--tv-border-md)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--tv-text-muted)' }}>Payment Channel:</span>
                <span style={{ fontWeight: '700', color: 'var(--tv-forest)' }}>Paystack NGN / Hotel Reception Desk</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tv-text-muted)' }}>Check-In Time:</span>
                <span style={{ fontWeight: '600', color: 'var(--tv-text)' }}>3:00 PM Onwards</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tv-text-muted)' }}>Check-Out Time:</span>
                <span style={{ fontWeight: '600', color: 'var(--tv-text)' }}>By 11:00 AM</span>
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.875rem' }}>
              <button
                onClick={() => window.print()}
                className="tv-btn tv-btn-ghost"
                style={{ padding: '0.75rem 1.25rem', fontSize: '0.78rem' }}
              >
                🖨️ Print Confirmation
              </button>
              <Link
                href="/manage-booking"
                className="tv-btn tv-btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.78rem' }}
              >
                Manage Reservation
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tv-bg)' }}><div className="tv-spinner" /></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
