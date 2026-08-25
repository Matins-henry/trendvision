'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@hotel/auth';
import { BookingListItemDTO } from './BookingsTable';

interface RoomOption {
  id: string;
  number: string;
  type: string;
  baseRate: number | string;
  status: string;
}

interface EditBookingModalProps {
  booking: BookingListItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rooms: RoomOption[];
}

export function EditBookingModal({ booking, isOpen, onClose, onSuccess, rooms }: EditBookingModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (booking && isOpen) {
      setSelectedRoomId(booking.room.id);
      // Format ISO string to datetime-local input format (YYYY-MM-DDTHH:mm)
      const checkInLocal = new Date(booking.checkIn).toISOString().slice(0, 16);
      const checkOutLocal = new Date(booking.checkOut).toISOString().slice(0, 16);
      setCheckIn(checkInLocal);
      setCheckOut(checkOutLocal);
      setNotes(booking.notes || '');
      setErrorMsg('');
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const currentRoom = rooms.find((r) => r.id === selectedRoomId);
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

    if (!booking) {
      setErrorMsg('No booking selected for editing.');
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
      const res = await authenticatedFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoomId,
          checkIn,
          checkOut,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update booking.');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Update booking error:', err);
      setErrorMsg('An error occurred while updating booking.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeRooms = rooms.filter((r) => r.status === 'ACTIVE' || r.id === booking.room.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-teal-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Edit Booking: {booking.reference}</h2>
            <p className="text-xs text-teal-100 mt-0.5">Guest: {booking.guest.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white text-xl font-bold p-1 rounded hover:bg-teal-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Room Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Room Assignment *</label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            >
              {activeRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.number} ({r.type}) — ${Number(r.baseRate).toFixed(2)}/night
                </option>
              ))}
            </select>
          </div>

          {/* Check-In Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Check-In Date & Time *</label>
            <input
              type="datetime-local"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          {/* Check-Out Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Check-Out Date & Time *</label>
            <input
              type="datetime-local"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          {/* Recalculated Summary */}
          <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 text-xs flex justify-between items-center">
            <div>
              <span className="text-teal-900 font-bold">{stayNights} Nights Stay</span>
              <p className="text-teal-700 text-[11px]">Availability self-exclusion verified</p>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-[11px]">Updated Total:</span>
              <p className="text-sm font-bold text-teal-900">${totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
