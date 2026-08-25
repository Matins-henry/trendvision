'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@hotel/auth';
import { GuestSearchSelect, GuestItem } from './GuestSearchSelect';
import { formatNaira } from '@/lib/currency';

interface RoomOption {
  id: string;
  number: string;
  type: string;
  baseRate: number | string;
  status: string;
}

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rooms: RoomOption[];
}

export function CreateBookingModal({ isOpen, onClose, onSuccess, rooms }: CreateBookingModalProps) {
  const [selectedGuest, setSelectedGuest] = useState<GuestItem | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Default dates: checkIn tomorrow, checkOut +3 days
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const checkout = new Date(tomorrow);
      checkout.setDate(checkout.getDate() + 2);
      checkout.setHours(10, 0, 0, 0);

      setCheckIn(tomorrow.toISOString().slice(0, 16));
      setCheckOut(checkout.toISOString().slice(0, 16));

      // Select first active room if available
      const activeRooms = rooms.filter((r) => r.status === 'ACTIVE');
      if (activeRooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(activeRooms[0].id);
      }
    }
  }, [isOpen, rooms]);

  if (!isOpen) return null;

  // Selected room details
  const currentRoom = rooms.find((r) => r.id === selectedRoomId);

  // Price & duration calculation
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const isValidDateOrder = checkInDate && checkOutDate && checkInDate < checkOutDate;

  const stayNights =
    isValidDateOrder && checkInDate && checkOutDate
      ? Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const totalAmount = currentRoom && stayNights > 0 ? Number(currentRoom.baseRate) * stayNights : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedGuest?.id) {
      setErrorMsg('Please select or register a guest.');
      return;
    }

    if (!selectedRoomId) {
      setErrorMsg('Please select a room.');
      return;
    }

    if (!isValidDateOrder) {
      setErrorMsg('Check-in date must be strictly before check-out date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authenticatedFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: selectedGuest.id,
          roomId: selectedRoomId,
          checkIn,
          checkOut,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create booking.');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create booking error:', err);
      setErrorMsg('An error occurred while creating booking.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeRooms = rooms.filter((r) => r.status === 'ACTIVE');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          background: 'var(--tv-bg-card)',
          color: 'var(--tv-text)',
          borderRadius: 'var(--tv-radius-lg)',
          maxWidth: '720px',
          width: '100%',
          boxShadow: 'var(--tv-shadow-lg)',
          border: '1px solid var(--tv-border-lg)',
          overflow: 'hidden',
          animation: 'tv-slide-up 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'var(--tv-bg-raised)',
            borderBottom: '1px solid var(--tv-border-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span className="tv-badge-gold" style={{ marginBottom: '0.25rem' }}>Reservation Desk</span>
            <h2 className="tv-serif" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--tv-text)', marginTop: '0.2rem' }}>
              Create New Booking
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--tv-text-muted)',
              fontSize: '1.25rem',
              fontWeight: '700',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {errorMsg && (
            <div style={{ padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius-sm)', color: 'var(--tv-danger)', fontSize: '0.8rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Left Column: Guest Selection & Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <GuestSearchSelect selectedGuest={selectedGuest} onSelectGuest={setSelectedGuest} />

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.5rem' }}>
                  Reservation Notes (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Special requests, arrival details, dietary preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="tv-input"
                  style={{ padding: '0.75rem', fontSize: '0.85rem', resize: 'none' }}
                />
              </div>
            </div>

            {/* Right Column: Room Selection, Dates & Pricing Summary */}
            <div style={{ background: 'var(--tv-bg-raised)', padding: '1.25rem', borderRadius: 'var(--tv-radius)', border: '1px solid var(--tv-border-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--tv-gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Stay & Suite Details
              </h3>

              {/* Room Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', color: 'var(--tv-text-muted)', marginBottom: '0.35rem' }}>Select Suite / Room *</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="tv-input"
                  style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose an available room --</option>
                  {activeRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.number} ({room.type}) — {formatNaira(Number(room.baseRate))}/night
                    </option>
                  ))}
                </select>
              </div>

              {/* Check-In Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', color: 'var(--tv-text-muted)', marginBottom: '0.35rem' }}>Check-In Date & Time *</label>
                <input
                  type="datetime-local"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="tv-input"
                  style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              {/* Check-Out Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', color: 'var(--tv-text-muted)', marginBottom: '0.35rem' }}>Check-Out Date & Time *</label>
                <input
                  type="datetime-local"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="tv-input"
                  style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              {/* Financial Calculation Card */}
              <div style={{ background: 'var(--tv-bg-card)', padding: '1rem', borderRadius: 'var(--tv-radius-sm)', border: '1px solid var(--tv-border-md)', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--tv-text-muted)', marginBottom: '0.4rem' }}>
                  <span>Stay Duration:</span>
                  <span style={{ fontWeight: '700', color: 'var(--tv-text)' }}>{stayNights} Nights</span>
                </div>
                {currentRoom && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--tv-text-muted)', marginBottom: '0.6rem' }}>
                    <span>Suite Rate:</span>
                    <span style={{ fontWeight: '700', color: 'var(--tv-text)' }}>{formatNaira(Number(currentRoom.baseRate))}/night</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: '800', color: 'var(--tv-gold)', paddingTop: '0.6rem', borderTop: '1px solid var(--tv-border-md)' }}>
                  <span>Total Payable:</span>
                  <span>{formatNaira(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--tv-border-md)' }}>
            <button
              type="button"
              onClick={onClose}
              className="tv-btn tv-btn-ghost"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.82rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="tv-btn tv-btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.82rem', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Creating Reservation...' : 'Confirm & Save Booking 🔒'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
