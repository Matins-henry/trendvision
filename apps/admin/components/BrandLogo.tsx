'use client';

import React from 'react';

interface BrandLogoProps {
  height?: number;
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
  layout?: 'horizontal' | 'stacked';
}

export function BrandLogo({
  height = 36,
  className = '',
  variant = 'auto',
  layout = 'horizontal',
}: BrandLogoProps) {
  const stemColor = variant === 'light' ? '#1B1410' : variant === 'dark' ? '#FEFAF4' : 'var(--tv-text)';
  const trendTextColor = variant === 'light' ? '#1B1410' : variant === 'dark' ? '#FEFAF4' : 'var(--tv-text)';
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
        <svg
          width={logoHeight * 1.1}
          height={logoHeight}
          viewBox="0 0 100 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="tvAdminGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3E0A9" />
              <stop offset="35%" stopColor="#C9A96E" />
              <stop offset="75%" stopColor="#A07D50" />
              <stop offset="100%" stopColor="#E5C583" />
            </linearGradient>
          </defs>

          <path
            d="M 22 18 H 78 V 26 H 55 V 72 H 62 V 78 H 38 V 72 H 45 V 26 H 22 V 18 Z"
            fill={stemColor}
          />
          <path d="M 22 18 V 28 H 26 V 22 H 30 V 18 Z" fill={stemColor} />
          <path d="M 78 18 V 28 H 74 V 22 H 70 V 18 Z" fill={stemColor} />

          <path
            d="M 28 65 C 32 45, 45 32, 85 20 C 70 34, 52 46, 42 62 Z"
            fill="url(#tvAdminGoldGrad)"
          />
        </svg>

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
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tv-brand-logo-horizontal ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
      }}
    >
      <svg
        width={logoHeight * 0.9}
        height={logoHeight}
        viewBox="0 0 100 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="tvAdminGoldGradHoriz" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3E0A9" />
            <stop offset="35%" stopColor="#C9A96E" />
            <stop offset="75%" stopColor="#A07D50" />
            <stop offset="100%" stopColor="#E5C583" />
          </linearGradient>
        </defs>

        <path
          d="M 22 18 H 78 V 26 H 55 V 72 H 62 V 78 H 38 V 72 H 45 V 26 H 22 V 18 Z"
          fill={stemColor}
        />
        <path d="M 22 18 V 28 H 26 V 22 H 30 V 18 Z" fill={stemColor} />
        <path d="M 78 18 V 28 H 74 V 22 H 70 V 18 Z" fill={stemColor} />

        <path
          d="M 28 65 C 32 45, 45 32, 85 20 C 70 34, 52 46, 42 62 Z"
          fill="url(#tvAdminGoldGradHoriz)"
        />
      </svg>

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
