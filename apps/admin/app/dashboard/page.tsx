'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaff, authenticatedFetch } from '@hotel/auth';
import { Navigation } from '@/components/Navigation';
import { formatNaira } from '@/lib/currency';

interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalActiveRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  activeBookings: number;
  openMaintenanceIssues: number;
  activeKeycards: number;
}

interface RecentBooking {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  guest: { name: string; email: string | null; phone?: string | null };
  room: { number: string; type: string };
  keycardCode?: string | null;
}

interface KeycardAlert {
  id: string;
  reference: string;
  keycardCode: string;
  checkOut: string;
  guest: { name: string };
  room: { number: string };
}

interface ExpenseCategorySummary {
  category: string;
  amount: number;
}

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { staff, isLoading } = useStaff();
  const router = useRouter();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueByMethod, setRevenueByMethod] = useState<Record<string, number>>({
    CASH: 0,
    CARD: 0,
    TRANSFER: 0,
    ONLINE: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategorySummary[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [keycardAlerts, setKeycardAlerts] = useState<KeycardAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<RecentBooking | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      const [resDashboard, resLogs] = await Promise.all([
        authenticatedFetch('/api/reports/dashboard'),
        authenticatedFetch('/api/audit-logs'),
      ]);

      const data = await resDashboard.json();
      if (!resDashboard.ok) {
        throw new Error(data.error || 'Failed to load dashboard metrics');
      }

      setMetrics(data.metrics);
      setRevenueByMethod(data.revenueByMethod || {});
      setExpensesByCategory(data.expensesByCategory || []);
      const bookingsList: RecentBooking[] = data.recentBookings || [];
      setRecentBookings(bookingsList);
      if (bookingsList.length > 0) {
        setSelectedBooking(bookingsList[0]);
      }
      setKeycardAlerts(data.keycardSecurityAlerts || []);

      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        setAuditLogs(dataLogs.auditLogs || []);
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !staff) {
      router.push('/login');
      return;
    }

    if (staff && staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      router.push('/access-denied');
      return;
    }

    if (staff) {
      loadDashboardData();
    }
  }, [staff, isLoading, router, loadDashboardData]);

  if (isLoading || loadingData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tv-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tv-spinner" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)' }}>Loading Executive Control Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tv-bg)', color: 'var(--tv-text)' }}>
      <Navigation />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Finnova Top Title Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span className="tv-label">Executive Control Center</span>
            <h1 className="tv-serif" style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--tv-text)', marginTop: '0.2rem' }}>
              Operations &amp; Financial Dashboard
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={loadDashboardData} className="tv-btn tv-btn-ghost" style={{ padding: '0.55rem 1.1rem', fontSize: '0.78rem' }}>
              🔄 Refresh Analytics
            </button>
            <button onClick={() => router.push('/bookings')} className="tv-btn tv-btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.78rem' }}>
              + Create Booking
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius-sm)', color: 'var(--tv-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tv-danger)' }}>✕</button>
          </div>
        )}

        {/* TOP METRICS STRIP */}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {/* Monthly Revenue */}
            <div className="tv-metric-card-glass" style={{ background: 'var(--tv-gold-pale)', borderColor: 'var(--tv-gold-pale-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold-b)' }}>Total Gross Revenue</span>
                <span style={{ fontSize: '1.2rem' }}>💰</span>
              </div>
              <p style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--tv-gold-b)', marginTop: '0.6rem', lineHeight: 1, fontFamily: 'Playfair Display, serif' }}>
                {formatNaira(metrics.totalRevenue)}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)', marginTop: '0.4rem' }}>
                From confirmed guest reservations
              </p>
            </div>

            {/* Net Operating Profit */}
            <div className="tv-metric-card-glass">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-text-muted)' }}>Net Operating Profit</span>
                <span style={{ fontSize: '1.2rem' }}>📈</span>
              </div>
              <p style={{ fontSize: '1.7rem', fontWeight: '800', color: metrics.netProfit >= 0 ? 'var(--tv-success)' : 'var(--tv-danger)', marginTop: '0.6rem', lineHeight: 1, fontFamily: 'Playfair Display, serif' }}>
                {formatNaira(metrics.netProfit)}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)', marginTop: '0.4rem' }}>
                Rev ({formatNaira(metrics.totalRevenue)}) - Exp ({formatNaira(metrics.totalExpenses)})
              </p>
            </div>

            {/* Live Occupancy Rate */}
            <div className="tv-metric-card-glass">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-text-muted)' }}>Live Occupancy Rate</span>
                <span style={{ fontSize: '1.2rem' }}>🏨</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.6rem' }}>
                <span style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--tv-text)', lineHeight: 1, fontFamily: 'Playfair Display, serif' }}>{metrics.occupancyRate}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)' }}>({metrics.occupiedRooms}/{metrics.totalActiveRooms} suites)</span>
              </div>
              <div style={{ width: '100%', background: 'var(--tv-bg-input)', borderRadius: '999px', height: '6px', marginTop: '0.6rem', overflow: 'hidden', border: '1px solid var(--tv-border-md)' }}>
                <div style={{ background: 'var(--tv-gold)', height: '100%', borderRadius: '999px', width: `${Math.min(100, metrics.occupancyRate)}%`, transition: 'width 500ms ease' }} />
              </div>
            </div>

            {/* Active Stays */}
            <div className="tv-metric-card-glass">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)' }}>Active Occupied Stays</span>
                <span style={{ fontSize: '1.2rem' }}>🔑</span>
              </div>
              <p style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--tv-gold-b)', marginTop: '0.6rem', lineHeight: 1, fontFamily: 'Playfair Display, serif' }}>
                {metrics.occupiedRooms ?? 0}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)', marginTop: '0.4rem' }}>Occupied suites on property</p>
            </div>
          </div>
        )}

        {/* Keycard Alerts Banner */}
        {keycardAlerts.length > 0 && (
          <div style={{ marginBottom: '2.5rem', padding: '1.25rem 1.5rem', background: 'var(--tv-gold-pale)', border: '1px solid var(--tv-gold-pale-md)', borderRadius: 'var(--tv-radius)', boxShadow: 'var(--tv-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🚨</span>
              <h3 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--tv-gold-b)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Security Alert — Keycard Code Pending Return
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {keycardAlerts.map((alert) => (
                <div key={alert.id} style={{ background: 'var(--tv-bg-card)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--tv-border-md)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: '700', color: 'var(--tv-text)', fontSize: '0.85rem' }}>Room {alert.room.number} · {alert.guest.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', marginLeft: '0.5rem' }}>(Ref: {alert.reference})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="tv-badge-gold">Keycard Code: {alert.keycardCode}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OPERATIONAL PANEL */}
        <div className="tv-finnova-dark-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--tv-gold)' }}>
                LIVE OPERATIONAL CONSOLE
              </span>
              <h2 className="tv-serif" style={{ fontSize: '1.4rem', color: '#FEFAF4', marginTop: '0.2rem' }}>
                Active Guest Reservations &amp; Queues
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="tv-badge-gold" style={{ background: 'rgba(201,169,110,0.15)' }}>
                {recentBookings.length} Bookings
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
            {/* Left Queue List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {recentBookings.map((b) => {
                const isSelected = selectedBooking?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: isSelected ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '1px solid var(--tv-gold)' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: '800',
                          color: '#FEFAF4',
                        }}
                      >
                        {b.guest.name.charAt(0)}
                      </div>

                      <div>
                        <p style={{ fontWeight: '700', color: '#FEFAF4', fontSize: '0.88rem' }}>{b.guest.name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'rgba(245,239,224,0.6)' }}>
                          Room {b.room.number} · {b.reference}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '700', color: 'var(--tv-gold)', fontSize: '0.88rem' }}>{formatNaira(b.totalAmount)}</p>
                      <span className="tv-badge-pill" style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem' }}>{b.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Booking Detail Panel */}
            {selectedBooking ? (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="tv-badge-gold">Reference: {selectedBooking.reference}</span>
                    <span className="tv-badge-forest" style={{ background: 'rgba(5,150,105,0.2)', color: '#10B981' }}>{selectedBooking.status}</span>
                  </div>

                  <h3 className="tv-serif" style={{ fontSize: '1.5rem', color: '#FEFAF4', marginBottom: '0.2rem' }}>
                    {selectedBooking.guest.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(245,239,224,0.6)', marginBottom: '1.5rem' }}>
                    {selectedBooking.guest.email || selectedBooking.guest.phone || 'Guest Contact Registered'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.625rem', marginBottom: '1.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.62rem', color: 'rgba(245,239,224,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suite</span>
                      <p style={{ fontWeight: '700', color: '#FEFAF4', fontSize: '0.9rem', marginTop: '2px' }}>Room {selectedBooking.room.number} ({selectedBooking.room.type})</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.62rem', color: 'rgba(245,239,224,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Stay Amount</span>
                      <p style={{ fontWeight: '700', color: 'var(--tv-gold)', fontSize: '0.9rem', marginTop: '2px' }}>{formatNaira(selectedBooking.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                  <button onClick={() => router.push('/bookings')} className="tv-btn tv-btn-gold" style={{ flex: 1, padding: '0.65rem', fontSize: '0.75rem' }}>
                    Manage Reservation →
                  </button>
                  <button onClick={() => router.push('/check-in')} className="tv-btn tv-btn-outline-light" style={{ padding: '0.65rem 1rem', fontSize: '0.75rem' }}>
                    Check-In Queue
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,239,224,0.5)', fontSize: '0.85rem' }}>
                Select a booking from the queue to view operational details
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Staff Activity Audit Log Feed */}
        <div className="tv-card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--tv-gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                📜 Real-Time Staff Activity Audit Stream
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', marginTop: '0.15rem' }}>
                Live operational activity log tracking every action by Managers &amp; Receptionists
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>
              Showing recent {auditLogs.length} events
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0' }}>
              No staff activity logged yet. Action logs will appear here as staff check-in guests, log expenses, and update room inventory.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {auditLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--tv-bg-raised)', borderRadius: '0.5rem', border: '1px solid var(--tv-border-md)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="tv-badge-gold" style={{ fontSize: '0.6rem' }}>{log.actorRole}</span>
                    <span style={{ fontWeight: '800', color: 'var(--tv-text)' }}>{log.actorName}</span>
                    <span style={{ color: 'var(--tv-text-muted)' }}>— {log.action.replace(/_/g, ' ')}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>
                    {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakdown Widgets Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Revenue Breakdown */}
          <div className="tv-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--tv-gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
              Revenue by Payment Channel
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Cash Payments', value: revenueByMethod.CASH || 0 },
                { label: 'Card Payments', value: revenueByMethod.CARD || 0 },
                { label: 'Bank Transfer', value: revenueByMethod.TRANSFER || 0 },
                { label: 'Online Gateway (Paystack)', value: revenueByMethod.ONLINE || 0 },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span className="tv-badge-pill">{item.label}</span>
                  <span style={{ fontWeight: '800', color: 'var(--tv-text)', marginLeft: 'auto' }}>{formatNaira(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Expenses Summary */}
          <div className="tv-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--tv-gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
              Operational Expense Categories
            </h2>
            {expensesByCategory.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>No expense logs found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {expensesByCategory.slice(0, 5).map((exp) => (
                  <div key={exp.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--tv-text-soft)', fontWeight: '500' }}>{exp.category}</span>
                    <span style={{ fontWeight: '800', color: 'var(--tv-text)' }}>{formatNaira(exp.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
