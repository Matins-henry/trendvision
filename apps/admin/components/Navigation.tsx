'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStaff, signOut, authenticatedFetch } from '@hotel/auth';
import { getAccessibleRoutes } from '@hotel/auth';
import { useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from './ThemeProvider';
import { BrandLogo } from './BrandLogo';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Overview', icon: '📈' },
  { path: '/bookings', label: 'Bookings', icon: '📅' },
  { path: '/check-in', label: 'Check In', icon: '🔑' },
  { path: '/check-out', label: 'Check Out', icon: '🚪' },
  { path: '/rooms', label: 'Rooms', icon: '🏠' },
  { path: '/rates', label: 'Rates', icon: '🏷️' },
  { path: '/reports', label: 'Reports', icon: '📊' },
];

export function Navigation() {
  const { staff, isLoading } = useStaff();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [newBookingCount, setNewBookingCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await signOut();
      router.push('/login');
    } catch {
      setLoggingOut(false);
    }
  }

  // Poll for live new bookings / expected arrivals for reception & staff alert
  const checkLiveAlerts = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/bookings/queue?type=check-in');
      if (res.ok) {
        const data = await res.json();
        setNewBookingCount(data.count || 0);
      }
    } catch {
      // Ignore background poll errors silently
    }
  }, []);

  useEffect(() => {
    if (staff) {
      checkLiveAlerts();
      const interval = setInterval(checkLiveAlerts, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [staff, checkLiveAlerts]);

  if (isLoading || !staff) return null;

  const accessiblePaths = getAccessibleRoutes(staff.role);
  const visibleItems = NAV_ITEMS.filter((item) => accessiblePaths.includes(item.path));
  const homePath = staff.role === 'RECEPTIONIST' ? '/bookings' : '/dashboard';

  return (
    <nav className="tv-navbar" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="tv-navbar-container">
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          
          {/* Dynamic Brand Logo — Role Aware Link */}
          <Link href={homePath} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <div className="admin-logo-desktop">
              <BrandLogo height={34} variant="auto" />
            </div>
            <div className="admin-logo-mobile">
              <BrandLogo height={28} variant="auto" />
            </div>
          </Link>

          {/* Desktop Nav Finnova Tab Pills (Visible >= 840px) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, justifyContent: 'center' }} className="admin-desktop-nav">
            {visibleItems.map((item) => {
              const isActive = pathname === item.path;
              const isCheckInTab = item.path === '/check-in';

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 200ms ease',
                    background: isActive ? 'var(--tv-gold)' : 'transparent',
                    color: isActive ? '#0D121F' : 'var(--tv-text-muted)',
                    boxShadow: isActive ? '0 4px 14px var(--tv-gold-glow)' : 'none',
                    position: 'relative',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>

                  {/* Pulsing Alert Counter for Check-In Queue */}
                  {isCheckInTab && newBookingCount > 0 && (
                    <span
                      style={{
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '0.62rem',
                        fontWeight: '800',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '999px',
                        marginLeft: '0.2rem',
                        boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                        animation: 'tv-pulse 2s infinite',
                      }}
                    >
                      {newBookingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            {/* Live Reception Alert Badge (Desktop/Tablet) */}
            {newBookingCount > 0 && (
              <Link
                href="/check-in"
                className="admin-alert-badge"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.65rem',
                  background: 'var(--tv-gold-pale)',
                  border: '1px solid var(--tv-gold-pale-md)',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: 'var(--tv-gold-b)',
                  textDecoration: 'none',
                }}
              >
                <span>🔔</span>
                <span className="admin-alert-text">{newBookingCount} New</span>
              </Link>
            )}

            <ThemeToggle />

            {/* Desktop Staff Role Badge & Sign Out */}
            <div style={{ alignItems: 'center', gap: '0.75rem' }} className="admin-desktop-user">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--tv-text)', lineHeight: 1.2 }}>{staff.name}</div>
                <span className="tv-badge-gold" style={{ fontSize: '0.58rem', padding: '0.1rem 0.5rem' }}>
                  {staff.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="tv-btn tv-btn-ghost"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '0.5rem', whiteSpace: 'nowrap' }}
              >
                {loggingOut ? '...' : 'Sign Out'}
              </button>
            </div>

            {/* Mobile Menu Toggle Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="admin-mobile-toggle"
              aria-label="Toggle Navigation Menu"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '0.6rem',
                background: 'var(--tv-surface)',
                border: '1px solid var(--tv-border)',
                color: 'var(--tv-text)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                transition: 'all 200ms ease',
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            top: '64px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
        />
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-drawer"
          style={{
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            backgroundColor: 'var(--tv-bg)',
            borderBottom: '1px solid var(--tv-border)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            padding: '1.25rem 1rem 1.75rem',
            zIndex: 99,
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          {/* User Profile Header Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.1rem',
              borderRadius: '0.85rem',
              background: 'var(--tv-surface)',
              border: '1px solid var(--tv-border)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--tv-gold)',
                  color: '#0D121F',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--tv-text)', lineHeight: 1.2 }}>
                  {staff.name}
                </div>
                <span
                  className="tv-badge-gold"
                  style={{ fontSize: '0.62rem', padding: '0.12rem 0.55rem', marginTop: '0.25rem', display: 'inline-block' }}
                >
                  {staff.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                fontSize: '0.78rem',
                borderRadius: '0.55rem',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <span>🚪</span>
              <span>{loggingOut ? '...' : 'Sign Out'}</span>
            </button>
          </div>

          {/* Nav Links Grid */}
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--tv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.2rem' }}>
            Navigation Menu
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '0.5rem' }}>
            {visibleItems.map((item) => {
              const isActive = pathname === item.path;
              const isCheckInTab = item.path === '/check-in';

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.8rem 1rem',
                    borderRadius: '0.7rem',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    background: isActive ? 'var(--tv-gold)' : 'var(--tv-surface)',
                    color: isActive ? '#0D121F' : 'var(--tv-text)',
                    border: '1px solid ' + (isActive ? 'var(--tv-gold)' : 'var(--tv-border)'),
                    transition: 'all 150ms ease',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isCheckInTab && newBookingCount > 0 && (
                    <span
                      style={{
                        background: '#EF4444',
                        color: '#FFF',
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                      }}
                    >
                      {newBookingCount} New
                    </span>
                  )}
                  <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>→</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .tv-navbar-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.25rem;
          height: 68px;
        }

        @keyframes tv-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        
        @media (min-width: 840px) {
          .admin-desktop-nav { display: flex !important; }
          .admin-desktop-user { display: flex !important; }
          .admin-mobile-toggle { display: none !important; }
          .admin-logo-mobile { display: none !important; }
          .admin-logo-desktop { display: block !important; }
        }

        @media (max-width: 839px) {
          .tv-navbar-container {
            padding: 0 0.85rem;
            height: 64px;
          }
          .admin-desktop-nav { display: none !important; }
          .admin-desktop-user { display: none !important; }
          .admin-mobile-toggle { display: flex !important; }
          .admin-logo-mobile { display: block !important; }
          .admin-logo-desktop { display: none !important; }
          .admin-alert-text { display: none !important; }
        }
      `}</style>
    </nav>
  );
}


