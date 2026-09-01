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
    borderRadius: '0.4rem',
    color: 'var(--tv-text)',
    padding: '0.75rem 0.85rem',
    width: '100%',
    fontSize: '1rem', // 16px prevents iOS Safari auto-zoom
    fontFamily: 'inherit',
    outline: 'none',
    minHeight: '46px',
    boxSizing: 'border-box',
    transition: 'border-color 150ms ease',
  };

  return (
    <form onSubmit={handleSearch} className="tv-search-box">
      {/* Check-In */}
      <div className="tv-search-field">
        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8A97E', marginBottom: '0.45rem' }}>
          CHECK IN
        </label>
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
        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8A97E', marginBottom: '0.45rem' }}>
          CHECK OUT
        </label>
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
        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8A97E', marginBottom: '0.45rem' }}>
          ROOM CATEGORY
        </label>
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
      <div style={{ flexShrink: 0, width: '100%' }} className="tv-search-submit-wrap">
        <button
          type="submit"
          className="tv-btn"
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '0.85rem 1.75rem',
            fontSize: '0.75rem',
            fontWeight: '800',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#1C1917',
            backgroundColor: '#C8A97E',
            border: '1px solid #BE9B6B',
            borderRadius: '0.4rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(200,169,126,0.3)',
            transition: 'all 200ms ease',
          }}
        >
          CHECK AVAILABILITY →
        </button>
      </div>
    </form>
  );
}
