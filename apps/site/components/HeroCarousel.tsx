'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Slide {
  id: number;
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
}

const HERO_SLIDES: Slide[] = [
  {
    id: 0,
    image: '/hotel-facade-night.jpg',
    tag: 'LUXURY REDEFINED',
    title: 'Experience Timeless Elegance',
    subtitle: 'Indulge in world-class comfort, ambient nighttime luxury, and personalized service at Trend Vision Luxury Apartments & Residences.',
    ctaPrimaryText: 'Discover Suites',
    ctaPrimaryHref: '/rooms',
  },
  {
    id: 1,
    image: '/hotel-bedroom-suite.jpg',
    tag: 'EXQUISITE ACCOMMODATIONS',
    title: 'Master Bedrooms & Refined Design',
    subtitle: 'Immerse yourself in masterfully crafted suites featuring custom architectural ceilings, king-size beds, and total privacy.',
    ctaPrimaryText: 'Reserve Your Stay',
    ctaPrimaryHref: '/rooms',
  },
  {
    id: 2,
    image: '/hotel-parlor-suite.jpg',
    tag: 'EXECUTIVE SUITES',
    title: 'Spacious Private Parlor Suites',
    subtitle: 'Unwind in sophisticated private living spaces complete with plush seating, Smart Entertainment, and high-speed Wi-Fi.',
    ctaPrimaryText: 'Book Suite Now',
    ctaPrimaryHref: '/rooms',
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  function handleGoToSlide(index: number) {
    setCurrentSlide(index);
  }

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="tv-hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background Images with smooth opacity cross-fade */}
      {HERO_SLIDES.map((s, idx) => (
        <div
          key={s.id}
          className="tv-hero-bg"
          style={{
            opacity: idx === currentSlide ? 1 : 0,
            transition: 'opacity 1200ms cubic-bezier(0.4, 0, 0.2, 1), transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: idx === currentSlide ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <img src={s.image} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}

      {/* Hero Content — Perfectly Symmetrical & Centered Layout */}
      <div className="tv-hero-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
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
          <div style={{ fontSize: '1.2rem', letterSpacing: '0.35em', color: '#C8A97E', marginBottom: '0.85rem' }}>
            ★ ★ ★ ★ ★
          </div>

          {/* Centered Symmetrical Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '0.68rem',
              fontWeight: '700',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#C8A97E',
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ width: '30px', height: '1px', background: '#C8A97E', opacity: 0.6 }} />
            <span>{slide.tag}</span>
            <span style={{ width: '30px', height: '1px', background: '#C8A97E', opacity: 0.6 }} />
          </div>

          {/* Centered Title */}
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: '400',
              color: '#FEFAF4',
              lineHeight: '1.15',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
              textAlign: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            TREND VISION<br />LUXURY APARTMENTS
          </h1>

          {/* Centered Subtitle */}
          <p
            style={{
              fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
              color: 'rgba(250,246,240,0.8)',
              lineHeight: 1.75,
              maxWidth: '560px',
              margin: '0 auto 2.25rem',
              textAlign: 'center',
            }}
          >
            {slide.subtitle}
          </p>

          {/* Centered Button */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Link
              href={slide.ctaPrimaryHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.9rem 2.75rem',
                fontSize: '0.74rem',
                fontWeight: '700',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#1C1917',
                backgroundColor: '#C8A97E',
                border: '1px solid #BE9B6B',
                borderRadius: '0.25rem',
                textDecoration: 'none',
                transition: 'all 250ms ease',
                boxShadow: '0 4px 20px rgba(200,169,126,0.3)',
              }}
            >
              EXPLORE SUITES →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: 'rgba(28,25,23,0.88)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(200,169,126,0.2)',
          padding: '0.875rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.14em', color: '#C8A97E', textTransform: 'uppercase' }}>PREMIUM LUXURY SUITES</span>
          <span style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.1em', color: 'rgba(250,246,240,0.7)', textTransform: 'uppercase' }}>24/7 PERSONALIZED SERVICE</span>
          <span style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.1em', color: 'rgba(250,246,240,0.7)', textTransform: 'uppercase' }}>BOUTIQUE RESIDENCE</span>
        </div>

        {/* Carousel Dots */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => handleGoToSlide(idx)}
              style={{
                width: idx === currentSlide ? '28px' : '8px',
                height: '8px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 300ms ease',
                background: idx === currentSlide ? '#C8A97E' : 'rgba(255,255,255,0.3)',
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
