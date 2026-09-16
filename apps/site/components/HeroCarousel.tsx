'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Slide {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  /** Optional real background image URL — leave empty to use gradient */
  bgImage?: string;
}

const HERO_SLIDES: Slide[] = [
  {
    id: 0,
    tag: 'LUXURY REDEFINED',
    title: 'Experience Timeless Elegance',
    subtitle: 'Indulge in world-class comfort, ambient nighttime luxury, and personalized service at Trend Vision Luxury Apartments & Residences.',
    ctaPrimaryText: 'Discover Suites',
    ctaPrimaryHref: '/rooms',
    bgImage: '/Hero/first.png',
  },
  {
    id: 1,
    tag: 'EXQUISITE ACCOMMODATIONS',
    title: 'Master Bedrooms & Refined Design',
    subtitle: 'Immerse yourself in masterfully crafted suites featuring custom architectural ceilings, king-size beds, and total privacy.',
    ctaPrimaryText: 'Reserve Your Stay',
    ctaPrimaryHref: '/rooms',
    bgImage: '/Hero/second.png',
  },
  {
    id: 2,
    tag: 'EXECUTIVE SUITES',
    title: 'Spacious Private Parlor Suites',
    subtitle: 'Unwind in sophisticated private living spaces complete with plush seating, Smart Entertainment, and high-speed Wi-Fi.',
    ctaPrimaryText: 'Book Suite Now',
    ctaPrimaryHref: '/rooms',
    bgImage: '/Hero/third.png',
  },
];

/** Fallback gradient backgrounds per slide index */
const SLIDE_GRADIENTS = [
  'radial-gradient(ellipse at 50% 30%, #292524 0%, #1C1917 50%, #0C0A09 100%)',
  'radial-gradient(ellipse at 50% 30%, #352B20 0%, #1C1917 50%, #0C0A09 100%)',
  'radial-gradient(ellipse at 50% 30%, #25201A 0%, #1C1917 50%, #0C0A09 100%)',
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

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
    if (distance > 50) setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    else if (distance < -50) setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section
      className="tv-hero"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'pan-y' }}
    >
      {/* Slide Backgrounds — real image if provided, gradient fallback */}
      {HERO_SLIDES.map((s, idx) => (
        <div
          key={s.id}
          className="tv-hero-bg"
          style={{
            opacity: idx === currentSlide ? 1 : 0,
            transition: 'opacity 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
            background: s.bgImage ? undefined : SLIDE_GRADIENTS[idx % SLIDE_GRADIENTS.length],
          }}
        >
          {/* Real photo if available */}
          {s.bgImage ? (
            <img
              src={s.bgImage}
              alt={s.title}
              className="tv-sharp-img"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                filter: 'contrast(1.08) saturate(1.08) brightness(0.94)',
                transform: idx === currentSlide ? 'scale(1.04)' : 'scale(1.0)',
                transition: 'transform 7000ms cubic-bezier(0.25, 1, 0.5, 1), opacity 1200ms ease',
                imageRendering: '-webkit-optimize-contrast',
              }}
            />
          ) : null}

          {/* Overlay — darkens photo for crisp text legibility */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: s.bgImage
                ? 'linear-gradient(to bottom, rgba(12,10,9,0.65) 0%, rgba(12,10,9,0.38) 50%, rgba(12,10,9,0.82) 100%)'
                : 'radial-gradient(circle at 50% 50%, rgba(200,169,126,0.12) 0%, transparent 65%)',
            }}
          />
        </div>
      ))}

      {/* Hero Content */}
      <div
        className="tv-hero-content"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}
      >
        <div
          key={`content-${slide.id}`}
          className="tv-hero-animated-text"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '780px',
            margin: '0 auto',
            padding: '0 1rem',
          }}
        >
          {/* 5 Gold Stars */}
          <div style={{ display: 'flex', gap: '0.3rem', color: '#C8A97E', fontSize: '1.2rem', marginBottom: '1.25rem', justifyContent: 'center' }}>
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>

          {/* Category Tag */}
          <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C8A97E', marginBottom: '1rem', display: 'block' }}>
            {slide.tag}
          </span>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(2rem, 5.5vw, 4.2rem)',
              fontWeight: '400',
              color: '#FEFAF4',
              lineHeight: 1.12,
              letterSpacing: '0.01em',
              margin: '0 0 1rem',
            }}
          >
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p
            className="tv-hero-subtitle"
            style={{
              fontSize: 'clamp(0.82rem, 2vw, 1.05rem)',
              color: 'rgba(250,246,240,0.82)',
              maxWidth: '560px',
              margin: '0 auto 1.5rem',
              lineHeight: 1.7,
            }}
          >
            {slide.subtitle}
          </p>

          {/* Pagination Dots — placed ABOVE the button to avoid collision */}
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                style={{
                  width: idx === currentSlide ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: idx === currentSlide ? '#C8A97E' : 'rgba(255,255,255,0.35)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 350ms ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Action Button */}
          <Link
            href={slide.ctaPrimaryHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.9rem 2.5rem',
              minHeight: '48px',
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#1C1917',
              backgroundColor: '#C8A97E',
              border: '1px solid #BE9B6B',
              borderRadius: '0.35rem',
              textDecoration: 'none',
              transition: 'all 300ms ease',
              boxShadow: '0 8px 25px rgba(200,169,126,0.3)',
            }}
          >
            {slide.ctaPrimaryText} →
          </Link>
        </div>
      </div>
    </section>
  );
}
