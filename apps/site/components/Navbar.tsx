'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import { Icons } from './Icons';

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'HOME' },
    { href: '/rooms', label: 'ROOMS & SUITES' },
    { href: '/explore', label: 'EXPLORE GALLERY' },
    { href: '/#amenities', label: 'FACILITIES' },
    { href: '/manage-booking', label: 'MY RESERVATION' },
  ];

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  return (
    <header
      className="tv-navbar"
      style={{
        height: '72px',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div
        className="tv-navbar-inner"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.25rem',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        {/* Dynamic Brand Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, minWidth: 0 }}>
          <BrandLogo height={38} variant="dark" />
        </Link>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }} className="desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: pathname === link.href ? '#C8A97E' : '#FAF6F0',
                fontSize: '0.72rem',
                fontWeight: '700',
                letterSpacing: '0.14em',
                textDecoration: 'none',
                transition: 'color 200ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right-side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* RESERVATION button: desktop only */}
          <Link
            href="/rooms"
            className="tv-navbar-cta tv-desktop-only"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              minHeight: '40px',
              fontSize: '0.68rem',
              fontWeight: '700',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#1C1917',
              backgroundColor: '#C8A97E',
              border: '1px solid #BE9B6B',
              borderRadius: '0.25rem',
              textDecoration: 'none',
              transition: 'all 200ms ease',
              boxShadow: '0 4px 14px rgba(200,169,126,0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <Icons.Clipboard size={14} color="#1C1917" />
            <span>RESERVATION</span>
          </Link>

          {/* Mobile Menu Hamburger — HIDDEN ON DESKTOP VIA CSS */}
          <button
            type="button"
            className="tv-mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            style={{
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Backdrop overlay for mobile menu */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 48,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`tv-mobile-nav ${mobileOpen ? 'open' : ''}`}
        style={{
          paddingTop: 'calc(72px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            style={{
              color: pathname === link.href ? '#C8A97E' : 'rgba(245,239,224,0.85)',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {link.label}
          </Link>
        ))}

        {/* Reserve Suite CTA in mobile drawer */}
        <Link
          href="/rooms"
          onClick={() => setMobileOpen(false)}
          style={{
            marginTop: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.85rem 2rem',
            width: '100%',
            fontSize: '0.75rem',
            fontWeight: '700',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#1C1917',
            backgroundColor: '#C8A97E',
            borderRadius: '0.35rem',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(200,169,126,0.3)',
          }}
        >
          RESERVE A SUITE →
        </Link>
      </div>
    </header>
  );
}
