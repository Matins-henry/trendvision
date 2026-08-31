'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function FloatingMobileBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 120) {
        if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 10) {
          // Scrolling down -> hide bar
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY && lastScrollY - currentScrollY > 10) {
          // Scrolling up -> reveal bar
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className="tv-floating-mobile-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99,
        padding: '0.65rem 1rem calc(0.65rem + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(12, 10, 9, 0.94)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(200, 169, 126, 0.25)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Concierge Direct Call Button */}
      <a
        href="tel:+2348000000000"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          padding: '0.65rem 0.85rem',
          minHeight: '44px',
          borderRadius: '0.35rem',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#FEFAF4',
          fontSize: '0.72rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <span>📞</span>
        <span>CALL CONCIERGE</span>
      </a>

      {/* Reserve Suite Gold Action Button */}
      <Link
        href="/rooms"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          padding: '0.65rem 1.25rem',
          minHeight: '44px',
          borderRadius: '0.35rem',
          backgroundColor: '#C8A97E',
          border: '1px solid #BE9B6B',
          color: '#1C1917',
          fontSize: '0.75rem',
          fontWeight: '800',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          flex: 1,
          boxShadow: '0 4px 14px rgba(200, 169, 126, 0.35)',
        }}
      >
        <span>🛏️</span>
        <span>RESERVE SUITE</span>
      </Link>
    </div>
  );
}
