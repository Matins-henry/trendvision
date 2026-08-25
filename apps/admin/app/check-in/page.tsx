'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaff, authenticatedFetch } from '@hotel/auth';
import { Navigation } from '@/components/Navigation';
import { BookingDetailsModal } from '@/components/bookings/BookingDetailsModal';
import { formatNaira } from '@/lib/currency';

interface QueueItem {
  id: string;
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  totalPaid: number;
  balanceOwing: number;
  guest: { id: string; name: string; email: string | null; phone: string | null };
  room: { id: string; number: string; type: string; baseRate: number };
}

export default function CheckInQueuePage() {
  const { staff, isLoading, hasRole } = useStaff();
  const router = useRouter();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [viewingBooking, setViewingBooking] = useState<any | null>(null);

  const loadCheckInQueue = useCallback(async () => {
    try {
      setLoadingQueue(true);
      setError(null);

      const res = await authenticatedFetch('/api/bookings/queue?type=check-in');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load check-in queue');
      }

      setQueue(data.queue || []);
    } catch (err: any) {
      console.error('Check-in queue load error:', err);
      setError(err.message || 'Failed to load check-in queue');
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !staff) {
      router.push('/login');
      return;
    }

    if (staff && !hasRole(['RECEPTIONIST', 'MANAGER'])) {
      router.push('/access-denied');
      return;
    }

    if (staff) {
      loadCheckInQueue();
    }
  }, [staff, isLoading, router, hasRole, loadCheckInQueue]);

  async function handleCheckIn(bookingId: string) {
    try {
      setUpdatingId(bookingId);
      const res = await authenticatedFetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CHECKED_IN' }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to check in guest');
        return;
      }

      await loadCheckInQueue();
    } catch (err) {
      console.error('Check-in error:', err);
      alert('An error occurred during check-in.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (isLoading || loadingQueue) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tv-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tv-spinner" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)' }}>Loading Check-In Arrivals Queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tv-bg)', color: 'var(--tv-text)' }}>
      <Navigation />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
          <div>
            <span className="tv-label">Front Desk Operations</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--tv-text)', marginTop: '0.25rem' }}>Check-In Arrivals Queue</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', marginTop: '0.25rem' }}>Guest arrivals queue for today and pending check-ins</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="tv-badge-gold">{queue.length} Arrivals Due</span>
            <button onClick={loadCheckInQueue} className="tv-btn tv-btn-ghost" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}>🔄 Refresh</button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: '0.75rem', color: 'var(--tv-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tv-danger)' }}>✕</button>
          </div>
        )}

        {/* Queue Cards */}
        {queue.length === 0 ? (
          <div style={{ background: 'var(--tv-bg-card)', border: '1px solid var(--tv-border)', borderRadius: 'var(--tv-radius)', boxShadow: 'var(--tv-shadow)', padding: '3.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--tv-text)', marginBottom: '0.4rem' }}>No Pending Check-Ins</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--tv-text-muted)', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
              All expected arrivals for today have been checked in or no reservations are scheduled.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {queue.map(item => (
              <div key={item.id} style={{ background: 'var(--tv-bg-card)', border: '1px solid var(--tv-border)', borderRadius: 'var(--tv-radius)', padding: '1.5rem', boxShadow: 'var(--tv-shadow-sm)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', transition: 'border-color 200ms ease' }}>
                {/* Guest Info */}
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.82rem', color: 'var(--tv-gold-b)' }}>{item.reference}</span>
                    <span className="tv-badge-pill">{item.status}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--tv-text)', marginBottom: '0.25rem' }}>{item.guest.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--tv-text-muted)' }}>
                    📧 {item.guest.email || 'No email'} · 📞 {item.guest.phone || 'No phone'}
                  </p>
                </div>
                {/* Room Details */}
                <div style={{ background: 'var(--tv-bg-raised)', border: '1px solid var(--tv-border)', borderRadius: 'var(--tv-radius-sm)', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: '0 1 300px' }}>
                  <div>
                    <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>Assigned Room</span>
                    <p style={{ fontWeight: '800', color: 'var(--tv-text)', marginTop: '0.2rem', fontSize: '0.85rem' }}>Room {item.room.number} ({item.room.type})</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>Balance Owing</span>
                    <p style={{ fontWeight: '800', marginTop: '0.2rem', fontSize: '0.85rem', color: item.balanceOwing > 0 ? 'var(--tv-gold-b)' : 'var(--tv-success)' }}>
                      {formatNaira(item.balanceOwing)} {item.balanceOwing === 0 ? '✓' : ''}
                    </p>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={() => setViewingBooking(item)} className="tv-btn tv-btn-ghost" style={{ padding: '0.55rem 1rem', fontSize: '0.8rem' }}>View</button>
                  <button
                    disabled={updatingId === item.id}
                    onClick={() => handleCheckIn(item.id)}
                    className="tv-btn tv-btn-primary"
                    style={{ padding: '0.55rem 1.25rem', fontSize: '0.8rem', opacity: updatingId === item.id ? 0.6 : 1 }}
                  >
                    {updatingId === item.id ? 'Checking In...' : '✅ Check In'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for full booking details & payment processing */}
        {viewingBooking && (
          <BookingDetailsModal
            booking={viewingBooking}
            isOpen={!!viewingBooking}
            onClose={() => setViewingBooking(null)}
            onRefresh={loadCheckInQueue}
            canEdit={true}
            onOpenEdit={() => {}}
          />
        )}
      </main>
    </div>
  );
}
