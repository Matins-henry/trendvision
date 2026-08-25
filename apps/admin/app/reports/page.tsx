'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaff, authenticatedFetch } from '@hotel/auth';
import { Navigation } from '@/components/Navigation';
import { formatNaira } from '@/lib/currency';

interface StaffActivityItem {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  bookingsCreatedCount: number;
  paymentsHandledCount: number;
  paymentsHandledTotal: number;
  expensesLoggedCount: number;
  expensesLoggedTotal: number;
  maintenanceFlaggedCount: number;
}

interface ReconciliationSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

export default function ReportsPage() {
  const { staff, isLoading, hasRole } = useStaff();
  const router = useRouter();

  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [staffActivity, setStaffActivity] = useState<StaffActivityItem[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
  });

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReportsData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      const res = await authenticatedFetch(`/api/reports/staff-activity?period=${period}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load report data');
      }

      setStaffActivity(data.staffActivity || []);
      if (data.reconciliation) {
        setReconciliation(data.reconciliation);
      }
    } catch (err: any) {
      console.error('Reports load error:', err);
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoadingData(false);
    }
  }, [period]);

  useEffect(() => {
    if (!isLoading && !staff) {
      router.push('/login');
      return;
    }

    if (staff && !hasRole(['MANAGER', 'OWNER'])) {
      router.push('/access-denied');
      return;
    }

    if (staff) {
      loadReportsData();
    }
  }, [staff, isLoading, router, hasRole, loadReportsData]);

  if (isLoading || loadingData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tv-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tv-spinner" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)' }}>Loading Reports & Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tv-bg)', color: 'var(--tv-text)' }}>
      <Navigation />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
          <div>
            <span className="tv-label">Management Analytics</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--tv-text)', marginTop: '0.25rem' }}>Activity & Financial Reports</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', marginTop: '0.25rem' }}>
              Staff performance metrics, revenue reconciliation, and activity audit summaries
            </p>
          </div>

          {/* Period Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--tv-bg-card)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--tv-border)' }}>
            {[
              { id: 'all', label: 'All Time' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '7d', label: 'Last 7 Days' },
              { id: 'today', label: 'Today' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as any)}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  background: period === tab.id ? 'var(--tv-gold)' : 'transparent',
                  color: period === tab.id ? '#0B0F19' : 'var(--tv-text-muted)',
                  transition: 'all 150ms ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: '0.75rem', color: 'var(--tv-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tv-danger)' }}>✕</button>
          </div>
        )}

        {/* Financial Reconciliation Summary */}
        <div className="tv-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--tv-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            Financial Reconciliation ({period.toUpperCase()})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--tv-success-pale)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--tv-border-md)' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: '700', color: 'var(--tv-success)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Total Payments Received
              </span>
              <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--tv-success)', marginTop: '0.4rem', lineHeight: 1 }}>
                {formatNaira(reconciliation.totalIncome)}
              </p>
            </div>

            <div style={{ background: 'var(--tv-danger-pale)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--tv-border-md)' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: '700', color: 'var(--tv-danger)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Total Operational Expenses
              </span>
              <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--tv-danger)', marginTop: '0.4rem', lineHeight: 1 }}>
                {formatNaira(reconciliation.totalExpenses)}
              </p>
            </div>

            <div style={{ background: 'var(--tv-gold-pale)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--tv-gold-pale-md)' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: '700', color: 'var(--tv-gold-b)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Net Operating Income
              </span>
              <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--tv-gold-b)', marginTop: '0.4rem', lineHeight: 1 }}>
                {formatNaira(reconciliation.netIncome)}
              </p>
            </div>
          </div>
        </div>

        {/* Staff Performance & Activity Table */}
        <div className="tv-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--tv-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Staff Member Performance Breakdown
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>
              Showing activity for {staffActivity.length} staff members
            </span>
          </div>

          {staffActivity.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>No staff activity recorded.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--tv-border)', fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.75rem' }}>Staff Member</th>
                    <th style={{ padding: '0.75rem 0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Bookings Created</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Payments Processed</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Revenue Handled</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Expenses Logged</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Maintenance Flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {staffActivity.map((member) => (
                    <tr key={member.id} className="tv-table-row">
                      <td style={{ padding: '0.875rem 0.75rem' }}>
                        <p style={{ fontWeight: '800', color: 'var(--tv-text)', fontSize: '0.82rem' }}>{member.name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>{member.email}</p>
                      </td>
                      <td style={{ padding: '0.875rem 0.75rem' }}>
                        <span className="tv-badge-gold">{member.role}</span>
                      </td>
                      <td style={{ padding: '0.875rem 0.75rem', textAlign: 'center', fontWeight: '700', color: 'var(--tv-text)' }}>
                        {member.bookingsCreatedCount}
                      </td>
                      <td style={{ padding: '0.875rem 0.75rem', textAlign: 'center', fontWeight: '700', color: 'var(--tv-text)' }}>
                        {member.paymentsHandledCount}
                      </td>
                      <td style={{ padding: '0.875rem 0.75rem', textAlign: 'right', fontWeight: '800', color: 'var(--tv-success)' }}>
                        {formatNaira(member.paymentsHandledTotal)}
                      </td>
                      <td style={{ padding: '0.875rem 0.75rem', textAlign: 'right', fontWeight: '700', color: 'var(--tv-text-soft)' }}>
                        {formatNaira(member.expensesLoggedTotal)}
                      </td>
                      <td style={{ padding: '0.875rem 0.75rem', textAlign: 'center', fontWeight: '700', color: 'var(--tv-gold)' }}>
                        {member.maintenanceFlaggedCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
