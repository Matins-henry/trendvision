'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DateSearchHeaderProps {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialType?: string;
}

export function DateSearchHeader({
  initialCheckIn = '',
  initialCheckOut = '',
  initialType = 'ALL',
}: DateSearchHeaderProps) {
  const router = useRouter();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultCheckIn = tomorrow.toISOString().split('T')[0];

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const defaultCheckOut = dayAfter.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(initialCheckIn || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut || defaultCheckOut);
  const [roomType, setRoomType] = useState(initialType || 'ALL');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (roomType && roomType !== 'ALL') params.set('type', roomType);
    router.push(`/rooms?${params.toString()}`);
  }

  const fieldStyle: React.CSSProperties = {
    backgroundColor: 'var(--tv-bg-input)',
    border: '1px solid var(--tv-border-md)',
    borderRadius: '0.5rem',
    color: 'var(--tv-text)',
    padding: '0.75rem 0.875rem',
    width: '100%',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 150ms ease',
  };

  return (
    <form onSubmit={handleSearch} className="tv-search-box">
      {/* Check-In */}
      <div className="tv-search-field">
        <label>Check In</label>
        <input
          type="date"
          value={checkIn}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setCheckIn(e.target.value)}
          style={fieldStyle}
          required
        />
      </div>

      {/* Check-Out */}
      <div className="tv-search-field">
        <label>Check Out</label>
        <input
          type="date"
          value={checkOut}
          min={checkIn || new Date().toISOString().split('T')[0]}
          onChange={(e) => setCheckOut(e.target.value)}
          style={fieldStyle}
          required
        />
      </div>

      {/* Room Type */}
      <div className="tv-search-field">
        <label>Room Category</label>
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          style={{ ...fieldStyle, cursor: 'pointer' }}
        >
          <option value="ALL">All Rooms & Suites</option>
          <option value="Standard">Standard Bedroom</option>
          <option value="Deluxe">Deluxe Parlor Suite</option>
          <option value="Apartment">Full Mini Apartment</option>
        </select>
      </div>

      {/* Submit Button */}
      <div style={{ flexShrink: 0 }}>
        <button
          type="submit"
          className="tv-btn tv-btn-primary"
          style={{ width: '100%', padding: '0.8rem 1.75rem' }}
        >
          Check Availability
        </button>
      </div>
    </form>
  );
}
