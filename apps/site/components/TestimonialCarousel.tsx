'use client';

import { useState, useEffect, useRef } from 'react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Mehwish A.',
    role: 'Executive Suite Guest',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    quote: 'Staying at Trend Vision Luxury Apartments was an absolute dream. The ambient nighttime lighting, master tufted lounge, and 24/7 personal concierge service made our anniversary stay unforgettable.',
  },
  {
    id: 2,
    name: 'Elizabeth Jeff',
    role: 'Mini Apartment Guest',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    quote: 'The Executive Mini Apartment at Trend Vision exceeded every expectation. Ultra high-speed fiber Wi-Fi, pristine marble finishes, and complete privacy right in the city.',
  },
  {
    id: 3,
    name: 'Emily Thomas',
    role: 'Boutique Residence Guest',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    quote: 'Trend Vision is truly boutique hospitality redefined. From instant online reservations to the immaculate suite furnishings, this is our top recommendation.',
  },
];

export function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Touch Swipe Gesture Refs for Mobile Devices
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 7000);
    return () => clearInterval(timer);
  }, [activeIndex]);

  function triggerTransition(nextIdx: number) {
    setAnimating(true);
    setTimeout(() => {
      setActiveIndex(nextIdx);
      setAnimating(false);
    }, 200);
  }

  function handlePrev() {
    if (animating) return;
    const nextIdx = (activeIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length;
    triggerTransition(nextIdx);
  }

  function handleNext() {
    if (animating) return;
    const nextIdx = (activeIndex + 1) % TESTIMONIALS.length;
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
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
  }

  const item = TESTIMONIALS[activeIndex];

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        backgroundColor: '#FFFFFF',
        color: '#1C1917',
        padding: '4rem 1.5rem',
        borderRadius: '1rem',
        maxWidth: '960px',
        margin: '0 auto 4rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.05)',
        border: '1px solid #F1F5F9',
        textAlign: 'center',
        position: 'relative',
        touchAction: 'pan-y',
      }}
    >
      {/* Top Gold Doodle Star */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
        <svg width="36" height="36" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 35 C18 20, 24 40, 32 15 M32 15 L26 18 M32 15 L33 22" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M36 10 L38.5 15.5 L44 16 L40 20 L41 25.5 L36 22.5 L31 25.5 L32 20 L28 16 L33.5 15.5 Z" fill="#FFC107" stroke="#FFC107" strokeWidth="1" />
        </svg>
      </div>

      <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8A97E', display: 'block', marginBottom: '0.5rem' }}>
        GUEST REVIEWS &amp; FEEDBACK
      </span>

      <h2
        style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
          fontWeight: '800',
          color: '#0F172A',
          marginBottom: '2.5rem',
          fontFamily: 'Playfair Display, serif',
        }}
      >
        What Our Guests Say
      </h2>

      {/* Horizontal Sliding Card Box */}
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          opacity: animating ? 0.3 : 1,
          transform: animating ? 'scale(0.98)' : 'scale(1)',
          transition: 'all 200ms ease-in-out',
        }}
      >
        {/* Quote Mark */}
        <span style={{ fontSize: '3rem', color: '#C8A97E', lineHeight: 1, fontFamily: 'Playfair Display, serif', display: 'block', marginBottom: '0.5rem' }}>
          “
        </span>

        {/* Quote Text */}
        <p
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: '#334155',
            lineHeight: 1.7,
            fontStyle: 'italic',
            marginBottom: '2rem',
            padding: '0 0.5rem',
          }}
        >
          {item.quote}
        </p>

        {/* Author Avatar & Info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem' }}>
          <img
            src={item.avatar}
            alt={item.name}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #C8A97E',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              {item.name}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
              {item.role}
            </span>
          </div>
        </div>
      </div>

      {/* Left Navigation Arrow */}
      <button
        onClick={handlePrev}
        aria-label="Previous Testimonial"
        style={{
          position: 'absolute',
          top: '50%',
          left: '1rem',
          transform: 'translateY(-50%)',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: '#FAF6F0',
          border: '1px solid #C8A97E',
          color: '#1C1917',
          fontSize: '1.25rem',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 10,
        }}
      >
        ‹
      </button>

      {/* Right Navigation Arrow */}
      <button
        onClick={handleNext}
        aria-label="Next Testimonial"
        style={{
          position: 'absolute',
          top: '50%',
          right: '1rem',
          transform: 'translateY(-50%)',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: '#FAF6F0',
          border: '1px solid #C8A97E',
          color: '#1C1917',
          fontSize: '1.25rem',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 10,
        }}
      >
        ›
      </button>

      {/* Pagination Indicator Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.25rem' }}>
        {TESTIMONIALS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => triggerTransition(idx)}
            style={{
              width: idx === activeIndex ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: idx === activeIndex ? '#C8A97E' : '#CBD5E1',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 300ms ease',
            }}
            aria-label={`Go to review ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
