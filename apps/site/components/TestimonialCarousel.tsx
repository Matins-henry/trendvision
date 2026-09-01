'use client';

import { useRef, useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  initials: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Mehwish A.',
    role: 'Executive Suite Guest',
    initials: 'MA',
    quote: 'Staying at Trend Vision was an absolute dream. The ambient nighttime lighting, master tufted lounge, and 24/7 personal concierge made our anniversary stay unforgettable.',
  },
  {
    id: 2,
    name: 'Elizabeth Jeff',
    role: 'Mini Apartment Guest',
    initials: 'EJ',
    quote: 'The Executive Mini Apartment at Trend Vision exceeded every expectation. Ultra high-speed fiber Wi-Fi, pristine marble finishes, and complete privacy right in the city.',
  },
  {
    id: 3,
    name: 'Emily Thomas',
    role: 'Boutique Residence Guest',
    initials: 'ET',
    quote: 'Trend Vision is truly boutique hospitality redefined. From instant online reservations to the immaculate suite furnishings, this is our top recommendation for Abuja.',
  },
  {
    id: 4,
    name: 'Daniel Okonkwo',
    role: 'Deluxe Suite Guest',
    initials: 'DO',
    quote: 'Premium experience from start to finish. The suite was spotless, the staff was warm and professional. Trend Vision has set a new standard for luxury accommodation in Nigeria.',
  },
];

export function TestimonialCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const startScrollLeft = useRef(0);

  // Auto-advance every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Scroll track horizontally without scrolling window viewport
  useEffect(() => {
    if (!trackRef.current) return;
    const card = trackRef.current.children[activeIndex] as HTMLElement;
    if (card) {
      const track = trackRef.current;
      const targetLeft = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
      track.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
  }, [activeIndex]);

  // Touch swipe on track
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  }
  function onTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.targetTouches[0].clientX;
  }
  function onTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return;
    const dist = touchStartX.current - touchEndX.current;
    if (dist > 50) setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    else if (dist < -50) setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  // Mouse drag on desktop
  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    touchStartX.current = e.clientX;
    startScrollLeft.current = trackRef.current?.scrollLeft ?? 0;
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !trackRef.current) return;
    const dx = e.clientX - (touchStartX.current ?? e.clientX);
    trackRef.current.scrollLeft = startScrollLeft.current - dx;
  }
  function onMouseUp(e: React.MouseEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dist = (touchStartX.current ?? e.clientX) - e.clientX;
    if (dist > 60) setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    else if (dist < -60) setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8A97E', display: 'block', marginBottom: '0.5rem' }}>
          GUEST REVIEWS &amp; FEEDBACK
        </span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: '800', color: 'var(--tv-text)', fontFamily: 'Playfair Display, serif', margin: 0 }}>
          What Our Guests Say
        </h2>
      </div>

      {/* Scrollable Card Track — swipe to navigate, no arrows */}
      <div
        ref={trackRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { isDragging.current = false; }}
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          padding: '0.5rem 1.5rem 1.5rem',
          cursor: 'grab',
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {TESTIMONIALS.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => setActiveIndex(idx)}
            style={{
              flex: '0 0 clamp(260px, 80vw, 340px)',
              scrollSnapAlign: 'center',
              backgroundColor: 'var(--tv-bg-card)',
              border: `1.5px solid ${idx === activeIndex ? '#C8A97E' : 'var(--tv-border-md)'}`,
              borderRadius: '1rem',
              padding: '2rem 1.75rem',
              boxShadow: idx === activeIndex
                ? '0 12px 32px rgba(200,169,126,0.18)'
                : '0 4px 12px rgba(0,0,0,0.04)',
              transform: idx === activeIndex ? 'translateY(-4px)' : 'translateY(0)',
              transition: 'all 350ms ease',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Stars */}
            <div style={{ display: 'flex', gap: '0.2rem', color: '#C8A97E', fontSize: '0.9rem' }}>
              {[1,2,3,4,5].map(s => <span key={s}>★</span>)}
            </div>

            {/* Quote */}
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--tv-text-soft)',
              lineHeight: 1.75,
              fontStyle: 'italic',
              margin: 0,
              flex: 1,
            }}>
              "{item.quote}"
            </p>

            {/* Author Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--tv-border)' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#1C1917',
                  color: '#C8A97E',
                  border: '1.5px solid #C8A97E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                  flexShrink: 0,
                }}
              >
                {item.initials}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--tv-text)', lineHeight: 1.2 }}>{item.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)', marginTop: '2px' }}>{item.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
        {TESTIMONIALS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            style={{
              width: idx === activeIndex ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: idx === activeIndex ? '#C8A97E' : '#CBD5E1',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 300ms ease',
              padding: 0,
            }}
            aria-label={`Review ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
