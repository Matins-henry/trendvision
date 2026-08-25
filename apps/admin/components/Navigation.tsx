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
    } catch (err) {
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
    <nav className="tv-navbar" style={{ height: '72px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.25rem', height: '100%' }}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Dynamic Brand Logo — Role Aware Link */}
          <Link href={homePath} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <BrandLogo height={38} variant="dark" />
          </Link>

          {/* Desktop Nav Finnova Tab Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'center' }} className="admin-desktop-nav">
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
                    padding: '0.5rem 1.1rem',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
            {/* Live Reception Alert Badge */}
            {newBookingCount > 0 && (
              <Link
                href="/check-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
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
                <span>{newBookingCount} New / Arrivals</span>
              </Link>
            )}

            <ThemeToggle />

            {/* Staff Role Badge */}
            <div style={{ textAlign: 'right' }} className="admin-user-info">
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--tv-text)', lineHeight: 1.2 }}>{staff.name}</div>
              <span className="tv-badge-gold" style={{ fontSize: '0.6rem', padding: '0.15rem 0.6rem' }}>
                {staff.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="tv-btn tv-btn-ghost"
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
            >
              {loggingOut ? '...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tv-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @media (min-width: 768px) {
          .admin-mobile-nav { display: none !important; }
          .admin-user-info { display: block !important; }
        }
        @media (max-width: 767px) {
          .admin-desktop-nav { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
