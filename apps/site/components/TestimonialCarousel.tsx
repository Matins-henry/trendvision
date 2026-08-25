'use client';

import { useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  location: string;
  initials: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 0,
    quote: 'Trend Vision is a true sanctuary of luxury. The 24/7 personalized service was incredibly prompt, and the private parlor suite offered the best comfort in town.',
    author: 'Chief Olumide B.',
    location: 'Ikoyi, Lagos',
    initials: 'OB',
    rating: 5,
  },
  {
    id: 1,
    quote: 'The Deluxe Parlor Suite exceeded all my expectations for my business trip. Ultra-fast Wi-Fi, quiet ambient lighting, and impeccable concierge service.',
    author: 'Elena Rostova',
    location: 'London, United Kingdom',
    initials: 'ER',
    rating: 5,
  },
  {
    id: 2,
    quote: 'Absolutely amazing stay! The staff went above and beyond to make our stay unforgettable. The custom LED suite and executive lounge were pure perfection.',
    author: 'Jessica & Mark A.',
    location: 'Victoria Island, Lagos',
    initials: 'JM',
    rating: 5,
  },
  {
    id: 3,
    quote: 'From the seamless online reservation to the warm welcome at check-in, Trend Vision sets a new standard for luxury hospitality.',
    author: 'Dr. Adebayo C.',
    location: 'Abuja, Nigeria',
    initials: 'AC',
    rating: 5,
  },
];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const item = TESTIMONIALS[current];

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
      {/* Testimonial Display Box */}
      <div
        key={`testimonial-${item.id}`}
        style={{
          background: 'var(--tv-bg-card)',
          border: '1px solid var(--tv-border-md)',
          borderRadius: '0.75rem',
          padding: '3rem 2.5rem',
          boxShadow: 'var(--tv-shadow)',
          position: 'relative',
          animation: 'tvFadeSlideUp 600ms ease-out forwards',
        }}
      >
        {/* Decorative Big Quote */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', fontSize: '4.5rem', fontFamily: 'Playfair Display, serif', color: '#C8A97E', opacity: 0.15, lineHeight: 1 }}>
          “
        </div>

        {/* Rating Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '1.25rem' }}>
          {Array.from({ length: item.rating }).map((_, i) => (
            <span key={i} style={{ color: '#C8A97E', fontSize: '1.2rem' }}>★</span>
          ))}
        </div>

        {/* Quote Text */}
        <p
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)',
            fontStyle: 'italic',
            color: 'var(--tv-text)',
            lineHeight: 1.7,
            textAlign: 'center',
            maxWidth: '680px',
            margin: '0 auto 2rem',
          }}
        >
          “{item.quote}”
        </p>

        {/* Author Avatar & Info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#C8A97E',
              color: '#1C1917',
              fontWeight: '800',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(200,169,126,0.3)',
            }}
          >
            {item.initials}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--tv-text)' }}>{item.author}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', letterSpacing: '0.04em' }}>{item.location}</div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Slide Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '2.25rem' }}>
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--tv-bg-card)',
            border: '1px solid var(--tv-border-lg)',
            color: 'var(--tv-text)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 200ms ease',
          }}
          aria-label="Previous testimonial"
        >
          ‹
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {TESTIMONIALS.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => setCurrent(idx)}
              style={{
                width: idx === current ? '28px' : '8px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                background: idx === current ? '#C8A97E' : 'var(--tv-border-lg)',
                cursor: 'pointer',
                transition: 'all 300ms ease',
              }}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent((prev) => (prev + 1) % TESTIMONIALS.length)}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--tv-bg-card)',
            border: '1px solid var(--tv-border-lg)',
            color: 'var(--tv-text)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 200ms ease',
          }}
          aria-label="Next testimonial"
        >
          ›
        </button>
      </div>
    </div>
  );
}
