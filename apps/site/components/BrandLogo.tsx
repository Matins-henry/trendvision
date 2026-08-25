'use client';

import React from 'react';

interface BrandLogoProps {
  height?: number;
  className?: string;
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'stacked';
  showTagline?: boolean;
}

/**
 * Trend Vision Ltd Official Logo Component
 * Rendered with vector precision, metallic gold gradients, and dual-mode theme support.
 */
export function BrandLogo({
  height = 44,
  className = '',
  variant = 'dark', // 'dark' = for dark backgrounds like Deep Forest Green; 'light' = for light backgrounds
  layout = 'horizontal',
  showTagline = false,
}: BrandLogoProps) {
  const isDarkBg = variant === 'dark';

  // Color tokens based on dark vs light surface
  const stemColor = isDarkBg ? '#FEFAF4' : '#1B1410';
  const trendTextColor = isDarkBg ? '#FFFFFF' : '#1B1410';
  const taglineColor = isDarkBg ? 'rgba(245, 239, 224, 0.65)' : '#7A6B5D';

  const logoHeight = height;

  if (layout === 'stacked') {
    return (
      <div
        className={`tv-brand-logo-stacked ${className}`}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.4rem',
        }}
      >
        {/* Emblem */}
        <svg
          width={logoHeight * 1.1}
          height={logoHeight}
          viewBox="0 0 100 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}
        >
          <defs>
            <linearGradient id="tvGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3E0A9" />
              <stop offset="35%" stopColor="#C9A96E" />
              <stop offset="75%" stopColor="#A07D50" />
              <stop offset="100%" stopColor="#E5C583" />
            </linearGradient>
          </defs>

          {/* Serif 'T' Stem & Crossbar */}
          <path
            d="M 22 18 H 78 V 26 H 55 V 72 H 62 V 78 H 38 V 72 H 45 V 26 H 22 V 18 Z"
            fill={stemColor}
          />
          {/* Top Serif accents on T */}
          <path d="M 22 18 V 28 H 26 V 22 H 30 V 18 Z" fill={stemColor} />
          <path d="M 78 18 V 28 H 74 V 22 H 70 V 18 Z" fill={stemColor} />

          {/* Golden Curved Wave / Swoosh Slicing Across T */}
          <path
            d="M 28 65 C 32 45, 45 32, 85 20 C 70 34, 52 46, 42 62 Z"
            fill="url(#tvGoldGrad)"
          />
        </svg>

        {/* Text Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: `${logoHeight * 0.42}px`,
              letterSpacing: '0.18em',
              lineHeight: 1,
            }}
          >
            <span style={{ color: trendTextColor }}>TREND</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #F3E0A9 0%, #C9A96E 50%, #A07D50 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              VISION
            </span>
          </div>

          {/* —— L T D —— line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#C9A96E',
              fontSize: `${logoHeight * 0.22}px`,
              fontWeight: 700,
              letterSpacing: '0.35em',
              marginTop: '0.2rem',
            }}
          >
            <span style={{ width: '18px', height: '1px', background: '#C9A96E', opacity: 0.7 }} />
            <span>L T D</span>
            <span style={{ width: '18px', height: '1px', background: '#C9A96E', opacity: 0.7 }} />
          </div>

          {showTagline && (
            <span
              style={{
                fontSize: `${logoHeight * 0.16}px`,
                color: taglineColor,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginTop: '0.25rem',
              }}
            >
              Hotel & Luxury Residences
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal Layout (for Navbar)
  return (
    <div
      className={`tv-brand-logo-horizontal ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.85rem',
        textDecoration: 'none',
      }}
    >
      {/* Emblem SVG */}
      <svg
        width={logoHeight * 0.9}
        height={logoHeight}
        viewBox="0 0 100 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }}
      >
        <defs>
          <linearGradient id="tvGoldGradHoriz" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3E0A9" />
            <stop offset="35%" stopColor="#C9A96E" />
            <stop offset="75%" stopColor="#A07D50" />
            <stop offset="100%" stopColor="#E5C583" />
          </linearGradient>
        </defs>

        {/* Serif 'T' */}
        <path
          d="M 22 18 H 78 V 26 H 55 V 72 H 62 V 78 H 38 V 72 H 45 V 26 H 22 V 18 Z"
          fill={stemColor}
        />
        {/* Top Serif accents */}
        <path d="M 22 18 V 28 H 26 V 22 H 30 V 18 Z" fill={stemColor} />
        <path d="M 78 18 V 28 H 74 V 22 H 70 V 18 Z" fill={stemColor} />

        {/* Golden Wave */}
        <path
          d="M 28 65 C 32 45, 45 32, 85 20 C 70 34, 52 46, 42 62 Z"
          fill="url(#tvGoldGradHoriz)"
        />
      </svg>

      {/* Brand Text */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: `${logoHeight * 0.45}px`,
            letterSpacing: '0.14em',
            lineHeight: 1,
          }}
        >
          <span style={{ color: trendTextColor }}>TREND</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #F3E0A9 0%, #C9A96E 50%, #A07D50 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            VISION
          </span>
        </div>

        {/* Subtitle line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#C9A96E',
            fontSize: `${logoHeight * 0.22}px`,
            fontWeight: 700,
            letterSpacing: '0.28em',
            marginTop: '0.25rem',
            lineHeight: 1,
          }}
        >
          <span style={{ width: '12px', height: '1px', background: '#C9A96E', opacity: 0.6 }} />
          <span>L T D</span>
          <span style={{ width: '12px', height: '1px', background: '#C9A96E', opacity: 0.6 }} />
        </div>
      </div>
    </div>
  );
}
