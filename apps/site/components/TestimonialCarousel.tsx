'use client';

import { useState } from 'react';

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Mehwish',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    quote: 'Compliment interested discretion estimating on stimulated apartments oh. The ambiance and personal concierge service were remarkable.',
  },
  {
    id: 2,
    name: 'Elizabeth Jeff',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    quote: 'Dear so sing when in find read of call. As distrusts behaviour abilities defective is. The private parlor suite exceeded every expectation.',
  },
  {
    id: 3,
    name: 'Emily Thomas',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    quote: 'Never at water me might. On formed merits hunted unable merely by mr whence or. Seamless stay, fast Wi-Fi and pristine apartment spaces.',
  },
];

export function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(1); // Default active Elizabeth Jeff

  return (
    <section
      style={{
        backgroundColor: '#FFFFFF',
        color: '#1C1917',
        padding: '5rem 1.5rem',
        borderRadius: '1rem',
        maxWidth: '1180px',
        margin: '0 auto 4rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3.5rem',
          alignItems: 'center',
        }}
      >
        {/* Left Side: Doodle, Title, Description, Gradient CTA Button */}
        <div>
          {/* Yellow Star Doodle Icon */}
          <div style={{ marginBottom: '1.25rem' }}>
            <svg width="42" height="42" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 35 C18 20, 24 40, 32 15 M32 15 L26 18 M32 15 L33 22"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M36 10 L38.5 15.5 L44 16 L40 20 L41 25.5 L36 22.5 L31 25.5 L32 20 L28 16 L33.5 15.5 Z"
                fill="#FFC107"
                stroke="#FFC107"
                strokeWidth="1"
              />
            </svg>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: '800',
              color: '#0F172A',
              lineHeight: 1.2,
              marginBottom: '1.25rem',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            What Our<br />Customers Says
          </h2>

          <p
            style={{
              fontSize: '0.92rem',
              color: '#64748B',
              lineHeight: 1.7,
              maxWidth: '420px',
              marginBottom: '2rem',
            }}
          >
            Relation so in confined smallest children unpacked delicate. Why sir end believe uncivil respect. Always get adieus nature day course for common.
          </p>

          <button
            style={{
              padding: '0.85rem 2.25rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #EC4899 0%, #F97316 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)',
              transition: 'transform 200ms ease, box-shadow 200ms ease',
            }}
          >
            View More
          </button>
        </div>

        {/* Right Side: Vertical Stacked Testimonial Cards with Active Purple Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
          {TESTIMONIALS.map((item, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.25rem 1.5rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '0.75rem',
                  border: isActive ? 'none' : '1px solid #F1F5F9',
                  boxShadow: isActive
                    ? '0 12px 32px rgba(139, 92, 246, 0.12), 0 2px 8px rgba(0,0,0,0.04)'
                    : '0 2px 8px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 300ms ease',
                  transform: isActive ? 'translateX(8px)' : 'none',
                }}
              >
                {/* Active Highlight Purple Vertical Line Indicator */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-1rem',
                      top: '15%',
                      bottom: '15%',
                      width: '5px',
                      backgroundColor: '#6366F1',
                      borderRadius: '4px',
                    }}
                  />
                )}

                {/* Avatar */}
                <img
                  src={item.avatar}
                  alt={item.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: isActive ? '2px solid #6366F1' : '2px solid #E2E8F0',
                    flexShrink: 0,
                  }}
                />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A' }}>
                      {item.name}
                    </h3>
                    <span style={{ fontSize: '1.25rem', color: isActive ? '#6366F1' : '#CBD5E1', lineHeight: 1 }}>
                      ❞
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: isActive ? '#334155' : '#64748B',
                      lineHeight: 1.5,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.quote}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
