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

  return (
    <footer className="tv-footer" style={{ paddingTop: '4.5rem', paddingBottom: '2.5rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Main Footer Links & Newsletter */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '3rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Brand Column */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <BrandLogo height={42} variant="dark" />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(245,239,224,0.7)', lineHeight: 1.7, maxWidth: '280px' }}>
              A luxury sanctuary offering refined bedroom suites, parlor lounges, and private kitchenette mini apartments designed for timeless elegance.
            </p>
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

          {/* Newsletter & Contact */}
          <div>
            <h4 className="tv-footer-heading">Newsletter & Contact</h4>
            <p style={{ fontSize: '0.82rem', color: 'rgba(245,239,224,0.7)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Subscribe to receive exclusive offers and luxury experience updates.
            </p>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="email"
                placeholder="Enter your email"
                className="tv-newsletter-input"
              />
              <button
                type="submit"
                className="tv-btn tv-btn-gold"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.72rem' }}
              >
                Subscribe
              </button>
            </form>
            <div style={{ fontSize: '0.82rem', color: 'rgba(245,239,224,0.6)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>📍 Trend Vision Tower, Victoria Island, Lagos</div>
              <div>📞 +234 (800) 555-TREND</div>
              <div>✉️ concierge@trendvisionhotel.com</div>
            </div>
          </div>
        </div>

        {/* Upgraded Map Location Card Section */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--tv-radius-lg)',
            padding: '1.75rem',
            marginBottom: '3rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ color: 'var(--tv-gold)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              HOTEL LOCATION
            </span>
            <h3 className="tv-serif" style={{ fontSize: '1.4rem', color: '#FEFAF4', marginTop: '0.35rem', marginBottom: '0.5rem' }}>
              Visit Trend Vision Hotel & Residences
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'rgba(245,239,224,0.7)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Conveniently situated in the heart of Victoria Island, Lagos — steps away from high-end dining, oceanfront promenades, and executive districts.
            </p>
            <a
              href="https://maps.google.com/?q=Victoria+Island+Lagos"
              target="_blank"
              rel="noopener noreferrer"
              className="tv-btn tv-btn-gold"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.72rem' }}
            >
              🗺️ Open in Google Maps
            </a>
          </div>

          <div
            style={{
              height: '200px',
              borderRadius: 'var(--tv-radius)',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: 'var(--tv-shadow-lg)',
            }}
          >
            <iframe
              title="Trend Vision Hotel Location Map"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'contrast(1.1) opacity(0.9)' }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7276587425126!2d3.4219!3d6.4281!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf53280e7d48d%3A0x4d048d21c432d66!2sVictoria%20Island%2C%20Lagos!5e0!3m2!1sen!2sng!4v1680000000000!5m2!1sen!2sng"
            />
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
            <span>Terms & Conditions</span>
            <span>Hospitality Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
