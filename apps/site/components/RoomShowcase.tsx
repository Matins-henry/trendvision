'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { formatNaira } from '@/lib/currency';

export interface ShowcaseRoomItem {
  id?: string;
  type: string;
  number?: string;
  title: string;
  baseRate: number;
  description: string;
  photos: string[];
  size: string;
  view: string;
  bed: string;
  features: string[];
}

const DEFAULT_SHOWCASE_ROOMS: ShowcaseRoomItem[] = [
  {
    id: 'standard-suite-101',
    type: 'Standard',
    number: '101',
    title: 'Standard Bedroom Suite',
    baseRate: 120000,
    description: 'A masterfully crafted bedroom retreat featuring ensuite bath, custom LED ambient lighting, Smart TV, and ultra-fast fiber Wi-Fi.',
    photos: ['/real-suite-1.jpg', '/real-suite-2.jpg', '/real-suite-3.jpg'],
    size: '32 M²',
    view: 'CITY VIEW',
    bed: 'LUXURY KING BED',
    features: ['COZY PRIVATE SUITE', 'ULTRA HIGH-SPEED WIFI', '24/7 PERSONAL CONCIERGE'],
  },
  {
    id: 'deluxe-suite-201',
    type: 'Deluxe',
    number: '201',
    title: 'Deluxe Parlor Suite',
    baseRate: 180000,
    description: 'Spacious master bedroom paired with a separate private parlor lounge, plush tufted seating, executive work desk, and ambient lighting.',
    photos: ['/real-suite-2.jpg', '/real-suite-3.jpg', '/real-suite-1.jpg'],
    size: '52 M²',
    view: 'COURTYARD VIEW',
    bed: 'KING BED & SOFA LOUNGE',
    features: ['PRIVATE PARLOR LOUNGE', 'COMPLIMENTARY REFRESHMENTS', 'EXECUTIVE WORK SPACE'],
  },
  {
    id: 'apartment-suite-301',
    type: 'Apartment',
    number: '301',
    title: 'Full Executive Mini Apartment',
    baseRate: 250000,
    description: 'The ultimate boutique residence experience featuring a private fully-equipped kitchenette, spacious parlor lounge, and master suite.',
    photos: ['/real-suite-3.jpg', '/real-suite-1.jpg', '/real-suite-2.jpg'],
    size: '75 M²',
    view: 'PANORAMIC VIEW',
    bed: 'SUPER KING SUITE',
    features: ['PRIVATE KITCHENETTE', 'FULL DINING & LOUNGE', 'VIP CHAUFFEUR PICKUP'],
  },
];

export function RoomShowcase({ rooms }: { rooms?: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Touch Swipe Gesture Refs for Mobile Devices
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Map database rooms uploaded by manager or fall back to showcase default
  const showcaseList: ShowcaseRoomItem[] = (rooms && rooms.length > 0)
    ? rooms.map((r, i) => ({
        id: r.id,
        type: r.type,
        number: r.number,
        title: `${r.type} Suite${r.number ? ` — Room ${r.number}` : ''}`,
        baseRate: Number(r.baseRate),
        description: r.description || DEFAULT_SHOWCASE_ROOMS[i % DEFAULT_SHOWCASE_ROOMS.length].description,
        photos: (r.photos && r.photos.length > 0) ? r.photos : [],
        size: DEFAULT_SHOWCASE_ROOMS[i % DEFAULT_SHOWCASE_ROOMS.length].size,
        view: DEFAULT_SHOWCASE_ROOMS[i % DEFAULT_SHOWCASE_ROOMS.length].view,
        bed: DEFAULT_SHOWCASE_ROOMS[i % DEFAULT_SHOWCASE_ROOMS.length].bed,
        features: DEFAULT_SHOWCASE_ROOMS[i % DEFAULT_SHOWCASE_ROOMS.length].features,
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
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                inset: 0,
                filter: 'brightness(1.02) contrast(1.02)',
                transition: 'opacity 300ms ease-in-out',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #292524 0%, #1C1917 100%)',
                color: '#C8A97E',
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.25rem',
                fontWeight: '600',
              }}
            >
              Trend Vision Luxury Suite
            </div>
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
        <div style={{ padding: '2.25rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header Rate */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.14em', color: '#C8A97E', textTransform: 'uppercase' }}>
                FROM {formatNaira(currentRoom.baseRate)} <span style={{ fontWeight: '400', color: 'var(--tv-text-muted)' }}>/ NIGHT</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', fontWeight: '600' }}>
                Suite {currentIndex + 1} of {showcaseList.length}
              </span>
            </div>

            {/* Title */}
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.65rem', fontWeight: '600', color: 'var(--tv-text)', marginBottom: '0.75rem', lineHeight: 1.25 }}>
              {currentRoom.title}
            </h3>

            {/* Description */}
            <p style={{ fontSize: '0.86rem', color: 'var(--tv-text-muted)', lineHeight: 1.7, marginBottom: '1.75rem' }}>
              {currentRoom.description}
            </p>

            {/* Specifications Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--tv-text-soft)', padding: '0.5rem 0', borderBottom: '1px solid var(--tv-border)' }}>
                <span>📐</span>
                <span>ROOM SIZE: {currentRoom.size}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--tv-text-soft)', padding: '0.5rem 0', borderBottom: '1px solid var(--tv-border)' }}>
                <span>🌆</span>
                <span>{currentRoom.view}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--tv-text-soft)', padding: '0.5rem 0', borderBottom: '1px solid var(--tv-border)' }}>
                <span>🛏️</span>
                <span>{currentRoom.bed}</span>
              </div>
              {currentRoom.features.map((feat, fIdx) => (
                <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--tv-text-soft)', padding: '0.5rem 0', borderBottom: '1px solid var(--tv-border)' }}>
                  <span>✨</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <Link
              href={currentRoom.id ? `/checkout?roomId=${currentRoom.id}` : `/rooms?type=${currentRoom.type}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.85rem 2rem',
                minHeight: '44px',
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
                padding: '0.85rem 2rem',
                minHeight: '44px',
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
