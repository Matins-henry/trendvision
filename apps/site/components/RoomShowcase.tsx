'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { formatNaira } from '@/lib/currency';
import { RoomPlaceholder } from './RoomPlaceholder';
import { Icons } from './Icons';

export interface ShowcaseRoomItem {
  id?: string;
  type: string;
  number?: string;
  title: string;
  baseRate: number;
  description: string;
  photos: string[];
}

const DEFAULT_SHOWCASE_ROOMS: ShowcaseRoomItem[] = [
  {
    id: 'standard-suite-101',
    type: 'Standard',
    number: '101',
    title: 'Standard Bedroom Suite',
    baseRate: 120000,
    description: 'A masterfully crafted bedroom retreat featuring ensuite bath, custom LED ambient lighting, Smart TV, and ultra-fast fiber Wi-Fi.',
    photos: [],
  },
  {
    id: 'deluxe-suite-201',
    type: 'Deluxe',
    number: '201',
    title: 'Deluxe Parlor Suite',
    baseRate: 180000,
    description: 'Spacious master bedroom paired with a separate private parlor lounge, plush tufted seating, executive work desk, and ambient lighting.',
    photos: [],
  },
  {
    id: 'apartment-suite-301',
    type: 'Apartment',
    number: '301',
    title: 'Full Executive Mini Apartment',
    baseRate: 250000,
    description: 'The ultimate boutique residence experience featuring a private fully-equipped kitchenette, spacious parlor lounge, and master suite.',
    photos: [],
  },
];

export function RoomShowcase({ rooms }: { rooms?: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const showcaseList: ShowcaseRoomItem[] = (rooms && rooms.length > 0)
    ? rooms.map((r, i) => ({
        id: r.id,
        type: r.type,
        number: r.number,
        title: `${r.type} Suite${r.number ? ` — Room ${r.number}` : ''}`,
        baseRate: Number(r.baseRate),
        description: r.description || DEFAULT_SHOWCASE_ROOMS[i % DEFAULT_SHOWCASE_ROOMS.length].description,
        photos: (r.photos && r.photos.length > 0) ? r.photos : [],
      }))
    : DEFAULT_SHOWCASE_ROOMS;

  const currentRoom = showcaseList[currentIndex] || DEFAULT_SHOWCASE_ROOMS[0];
  const photos = currentRoom.photos || [];
  const activePhoto = photos.length > 0 ? (photos[photoIndex % photos.length] || photos[0]) : null;

  function triggerTransition(nextIndex: number) {
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setPhotoIndex(0);
      setAnimating(false);
    }, 200);
  }

  function handlePrevRoom() {
    if (animating) return;
    const nextIdx = (currentIndex - 1 + showcaseList.length) % showcaseList.length;
    triggerTransition(nextIdx);
  }

  function handleNextRoom() {
    if (animating) return;
    const nextIdx = (currentIndex + 1) % showcaseList.length;
    triggerTransition(nextIdx);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.targetTouches[0].clientX;
  }

  function handleTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNextRoom();
    } else if (distance < -50) {
      handlePrevRoom();
    }
  }

  return (
    <div
      className="tv-room-showcase-wrapper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ maxWidth: '1120px', margin: '0 auto', position: 'relative', touchAction: 'pan-y' }}
    >
      {/* Main Room Showcase Split Card */}
      <div
        className="tv-room-showcase-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          background: 'var(--tv-bg-card)',
          border: '1px solid var(--tv-border-md)',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
          opacity: animating ? 0.4 : 1,
          transform: animating ? 'scale(0.995)' : 'scale(1)',
          transition: 'all 200ms ease-in-out',
        }}
      >
        {/* Photo Side */}
        <div className="tv-room-showcase-photo" style={{ position: 'relative', minHeight: '440px', overflow: 'hidden', backgroundColor: '#F7F3EC' }}>
          {activePhoto ? (
            <img
              key={activePhoto}
              src={activePhoto}
              alt={currentRoom.title}
              className="tv-sharp-img"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                inset: 0,
                filter: 'contrast(1.06) saturate(1.08) brightness(0.97)',
                transition: 'opacity 300ms ease-in-out',
                imageRendering: '-webkit-optimize-contrast',
              }}
            />
          ) : (
            <RoomPlaceholder type={currentRoom.type} number={currentRoom.number} height="100%" />
          )}

          {/* Room Category Badge on Photo */}
          <span
            style={{
              position: 'absolute',
              top: '1.25rem',
              left: '1.25rem',
              padding: '0.4rem 0.95rem',
              fontSize: '0.65rem',
              fontWeight: '700',
              letterSpacing: '0.14em',
              color: '#1C1917',
              backgroundColor: 'rgba(250,246,240,0.95)',
              border: '1px solid #C8A97E',
              borderRadius: '0.25rem',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              zIndex: 10,
            }}
          >
            {currentRoom.type.toUpperCase()} SUITE
          </span>

          {/* Left Navigation Arrow */}
          <button
            onClick={handlePrevRoom}
            aria-label="Previous Suite"
            style={{
              position: 'absolute',
              top: '50%',
              left: '1rem',
              transform: 'translateY(-50%)',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(250,246,240,0.95)',
              border: '1px solid #C8A97E',
              color: '#1C1917',
              fontSize: '1.5rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
              zIndex: 10,
              transition: 'transform 200ms ease, background-color 200ms ease',
            }}
          >
            ‹
          </button>

          {/* Right Navigation Arrow */}
          <button
            onClick={handleNextRoom}
            aria-label="Next Suite"
            style={{
              position: 'absolute',
              top: '50%',
              right: '1rem',
              transform: 'translateY(-50%)',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(250,246,240,0.95)',
              border: '1px solid #C8A97E',
              color: '#1C1917',
              fontSize: '1.5rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
              zIndex: 10,
              transition: 'transform 200ms ease, background-color 200ms ease',
            }}
          >
            ›
          </button>

          {/* Photo Indicator Dots */}
          {photos.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 5,
                background: 'rgba(28,25,23,0.75)',
                padding: '0.4rem 0.75rem',
                borderRadius: '999px',
                backdropFilter: 'blur(8px)',
              }}
            >
              {photos.map((_, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => setPhotoIndex(pIdx)}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    border: 'none',
                    background: pIdx === photoIndex ? '#C8A97E' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                  aria-label={`Photo ${pIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info Side */}
        <div style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
          {/* Header Rate + Counter */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.14em', color: '#C8A97E', textTransform: 'uppercase' }}>
              FROM {formatNaira(currentRoom.baseRate)} <span style={{ fontWeight: '400', color: 'var(--tv-text-muted)' }}>/ NIGHT</span>
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)', fontWeight: '600' }}>
              {currentIndex + 1} / {showcaseList.length}
            </span>
          </div>

          {/* Title */}
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: '600', color: 'var(--tv-text)', lineHeight: 1.25, margin: 0 }}>
            {currentRoom.title}
          </h3>

          {/* Description */}
          <p style={{ fontSize: '0.88rem', color: 'var(--tv-text-muted)', lineHeight: 1.75, margin: 0 }}>
            {currentRoom.description}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href={currentRoom.id ? `/checkout?roomId=${currentRoom.id}` : `/rooms?type=${currentRoom.type}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.9rem 2rem',
                minHeight: '48px',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#1C1917',
                backgroundColor: '#C8A97E',
                border: '1px solid #BE9B6B',
                borderRadius: '0.35rem',
                textDecoration: 'none',
                transition: 'all 200ms ease',
                boxShadow: '0 4px 12px rgba(200,169,126,0.3)',
              }}
            >
              RESERVE SUITE →
            </Link>
            <Link
              href="/rooms"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.9rem 2rem',
                minHeight: '48px',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--tv-text)',
                backgroundColor: 'transparent',
                border: '1px solid var(--tv-border-lg)',
                borderRadius: '0.35rem',
                textDecoration: 'none',
                transition: 'all 200ms ease',
              }}
            >
              VIEW ALL ROOMS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
