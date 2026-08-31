'use client';

import Link from 'next/link';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/rooms', label: 'Rooms & Suites' },
    { href: '/#amenities', label: 'Amenities' },
    { href: '/manage-booking', label: 'My Reservation' },
  ];

  const categories = [
    { href: '/rooms?type=Standard', label: 'Standard Bedroom Suites' },
    { href: '/rooms?type=Deluxe', label: 'Deluxe Parlor Suites' },
    { href: '/rooms?type=Apartment', label: 'Full Mini Apartments' },
    { href: '/#dining', label: 'Fine Dining & VVIP Lounge' },
  ];

  const socialLinks = [
    { label: 'Instagram', href: 'https://instagram.com', icon: '📸' },
    { label: 'Facebook', href: 'https://facebook.com', icon: '📘' },
    { label: 'YouTube', href: 'https://youtube.com', icon: '▶️' },
  ];

  return (
    <footer className="tv-footer" style={{ paddingTop: '4.5rem', paddingBottom: '2.5rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Main Footer Links & Contact */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '3rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Brand Column */}
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <BrandLogo height={42} variant="dark" />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(245,239,224,0.7)', lineHeight: 1.7, maxWidth: '280px' }}>
              A luxury sanctuary offering refined bedroom suites, parlor lounges, and private kitchenette mini apartments designed for timeless elegance.
            </p>

            {/* Social Links Row */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C8A97E', marginBottom: '0.75rem' }}>
                Follow Our Journey
              </h4>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.35rem',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(245,239,224,0.85)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="tv-footer-heading">Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="tv-footer-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Accommodations */}
          <div>
            <h4 className="tv-footer-heading">Accommodations</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {categories.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="tv-footer-link">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Contact Info */}
          <div>
            <h4 className="tv-footer-heading">Contact &amp; Location</h4>
            <div style={{ fontSize: '0.84rem', color: 'rgba(245,239,224,0.75)', display: 'flex', flexDirection: 'column', gap: '0.75rem', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: '#C8A97E', flexShrink: 0 }}>📍</span>
                <span>Trend Vision Limited, Abuja, plot 140, court road</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: '#C8A97E', flexShrink: 0 }}>📞</span>
                <a href="tel:+2348032780622" style={{ color: 'inherit', textDecoration: 'none' }}>
                  +234 803 278 0622
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: '#C8A97E', flexShrink: 0 }}>✉️</span>
                <a href="mailto:trendslimited@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>
                  trendslimited@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Policies Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <p style={{ fontSize: '0.78rem', color: 'rgba(245,239,224,0.5)' }}>
            © {new Date().getFullYear()} TREND VISION LTD. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'rgba(245,239,224,0.5)' }}>
            <span>Privacy Policy</span>
            <span>Terms &amp; Conditions</span>
            <span>Hospitality Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
