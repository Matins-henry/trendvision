'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './BrandLogo';

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'HOME' },
    { href: '/rooms', label: 'ROOMS & SUITES' },
    { href: '/#explore', label: 'EXPLORE' },
    { href: '/#amenities', label: 'FACILITIES' },
    { href: '/manage-booking', label: 'MY RESERVATION' },
  ];

  return (
    <header className="tv-navbar" style={{ height: '84px' }}>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Dynamic Brand Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <BrandLogo height={46} variant="dark" />
        </Link>

        {/* Desktop Nav */}
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
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions & Mobile Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <Link
            href="/rooms"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.6rem 1.4rem',
              fontSize: '0.7rem',
              fontWeight: '700',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#1C1917',
              backgroundColor: '#C8A97E',
              border: '1px solid #BE9B6B',
              borderRadius: '0.25rem',
              textDecoration: 'none',
              transition: 'all 200ms ease',
              boxShadow: '0 4px 14px rgba(200,169,126,0.25)',
            }}
          >
            📋 RESERVATION
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="tv-mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`tv-mobile-nav ${mobileOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            style={{
              color: pathname === link.href ? '#C8A97E' : 'rgba(245,239,224,0.85)',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
