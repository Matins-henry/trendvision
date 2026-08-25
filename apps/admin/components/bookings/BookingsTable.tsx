import React from 'react';
import { BookingStatusBadge } from './BookingStatusBadge';
import { formatNaira } from '@/lib/currency';

export interface BookingListItemDTO {
  id: string;
  reference: string;
  checkIn: string;
  checkOut: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  source: 'ONLINE' | 'STAFF';
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  guest: { id: string; name: string; email: string | null; phone: string | null };
  room: { id: string; number: string; type: string; baseRate: string };
  createdBy?: { id: string; name: string } | null;
}

interface BookingsTableProps {
  bookings: BookingListItemDTO[];
  isLoading: boolean;
  canEdit: boolean;
  onSelectBooking: (booking: BookingListItemDTO) => void;
  onOpenEdit: (booking: BookingListItemDTO) => void;
  onStatusChange: (bookingId: string, status: 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED') => void;
}

const TH: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.62rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--tv-text-muted)',
  borderBottom: '1px solid var(--tv-border)',
  background: 'var(--tv-bg-raised)',
  whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = {
  padding: '0.875rem 1rem',
  fontSize: '0.8rem',
  color: 'var(--tv-text)',
  borderBottom: '1px solid var(--tv-border)',
  verticalAlign: 'middle',
};

export function BookingsTable({ bookings, isLoading, canEdit, onSelectBooking, onOpenEdit, onStatusChange }: BookingsTableProps) {
  const containerStyle: React.CSSProperties = {
    background: 'var(--tv-bg-card)',
    border: '1px solid var(--tv-border)',
    borderRadius: 'var(--tv-radius)',
    boxShadow: 'var(--tv-shadow-sm)',
    overflow: 'hidden',
  };

  if (isLoading) {
    return (
      <div style={{ ...containerStyle, padding: '3rem', textAlign: 'center' }}>
        <div className="tv-spinner" style={{ margin: '0 auto 0.75rem' }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)' }}>Loading bookings data...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div style={{ ...containerStyle, padding: '3.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📅</span>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--tv-text)', marginBottom: '0.4rem' }}>No Bookings Found</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', maxWidth: '340px', margin: '0 auto', lineHeight: 1.6 }}>
          No reservation records match your active filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Reference</th>
              <th style={TH}>Guest</th>
              <th style={TH}>Room</th>
              <th style={TH}>Dates</th>
              <th style={TH}>Amount</th>
              <th style={TH}>Status</th>
              <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => {
              const checkIn = new Date(booking.checkIn);
              const checkOut = new Date(booking.checkOut);
              const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000));

              return (
                <tr key={booking.id} className="tv-table-row">
                  <td style={TD}>
                    <button
                      onClick={() => onSelectBooking(booking)}
                      style={{ fontWeight: '800', color: 'var(--tv-gold-b)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                    >
                      {booking.reference}
                    </button>
                  </td>
                  <td style={TD}>
                    <p style={{ fontWeight: '700', color: 'var(--tv-text)', marginBottom: '0.15rem' }}>{booking.guest.name}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>
                      {booking.guest.email || booking.guest.phone || 'No contact info'}
                    </p>
                  </td>
                  <td style={TD}>
                    <span style={{ fontWeight: '700', color: 'var(--tv-text)' }}>Room {booking.room.number}</span>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>{booking.room.type}</span>
                  </td>
                  <td style={TD}>
                    <p style={{ fontWeight: '600', color: 'var(--tv-text)', marginBottom: '0.15rem' }}>
                      {checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--tv-gold)', fontWeight: '600' }}>{nights} Nights</span>
                  </td>
                  <td style={{ ...TD, fontWeight: '800', color: 'var(--tv-text)' }}>
                    {formatNaira(booking.totalAmount)}
                  </td>
                  <td style={TD}><BookingStatusBadge status={booking.status} /></td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onSelectBooking(booking)}
                        className="tv-btn tv-btn-ghost"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}
                      >View</button>
                      {canEdit && (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                        <>
                          <button onClick={() => onOpenEdit(booking)} className="tv-btn tv-btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}>Edit</button>
                          <button onClick={() => onStatusChange(booking.id, 'CHECKED_IN')} className="tv-btn tv-btn-outline-gold" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}>Check In</button>
                        </>
                      )}
                      {canEdit && booking.status === 'CHECKED_IN' && (
                        <button onClick={() => onStatusChange(booking.id, 'CHECKED_OUT')} className="tv-btn tv-btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}>Check Out</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
