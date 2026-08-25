'use client';

import { useState } from 'react';

interface RoomGalleryModalProps {
  title: string;
  photos: string[];
  onClose: () => void;
}

export function RoomGalleryModal({ title, photos, onClose }: RoomGalleryModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!photos || photos.length === 0) return null;

  function prevSlide() {
    setCurrentIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }

  function nextSlide() {
    setCurrentIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(11, 15, 25, 0.96)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem',
      }}
    >
      {/* Top Header Controls */}
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FEFAF4',
        }}
      >
        <div>
          <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.18em', color: '#D4AF37', textTransform: 'uppercase' }}>
            SUITE PHOTO GALLERY
          </span>
          <h2 className="tv-serif" style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0.2rem 0 0' }}>
            {title}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(245,239,224,0.7)', fontWeight: '600' }}>
            Photo {currentIdx + 1} of {photos.length}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FEFAF4',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Image Slider View */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1080px',
          height: '65vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '1rem 0',
        }}
      >
        {photos.length > 1 && (
          <button
            onClick={prevSlide}
            style={{
              position: 'absolute',
              left: '1rem',
              zIndex: 10,
              background: 'rgba(11,15,25,0.75)',
              border: '1px solid rgba(212,175,55,0.4)',
              color: '#D4AF37',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              fontSize: '1.5rem',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 200ms ease',
            }}
          >
            ‹
          </button>
        )}

        <img
          src={photos[currentIdx]}
          alt={`${title} - Slide ${currentIdx + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'tv-hero-text-in 300ms ease',
          }}
        />

        {photos.length > 1 && (
          <button
            onClick={nextSlide}
            style={{
              position: 'absolute',
              right: '1rem',
              zIndex: 10,
              background: 'rgba(11,15,25,0.75)',
              border: '1px solid rgba(212,175,55,0.4)',
              color: '#D4AF37',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              fontSize: '1.5rem',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 200ms ease',
            }}
          >
            ›
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', maxWidth: '100%', padding: '0.5rem 0' }}>
          {photos.map((photo, idx) => {
            const isActive = idx === currentIdx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  padding: 0,
                  border: isActive ? '2px solid #D4AF37' : '2px solid transparent',
                  opacity: isActive ? 1 : 0.45,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  flexShrink: 0,
                  background: '#000',
                }}
              >
                <img src={photo} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
