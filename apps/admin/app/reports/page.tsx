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

interface ExecutiveReport {
  id: string;
  title: string;
  content: string;
  shiftDate: string;
  submittedBy: string;
  authorRole: string;
  createdAt: string;
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

  const [reports, setReports] = useState<ExecutiveReport[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [viewingReport, setViewingReport] = useState<ExecutiveReport | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReportsData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      const [resActivity, resExecutive] = await Promise.all([
        authenticatedFetch(`/api/reports/staff-activity?period=${period}`),
        authenticatedFetch('/api/reports/executive'),
      ]);

      const dataActivity = await resActivity.json();
      if (resActivity.ok) {
        setStaffActivity(dataActivity.staffActivity || []);
        if (dataActivity.reconciliation) {
          setReconciliation(dataActivity.reconciliation);
        }
      }

      if (resExecutive.ok) {
        const dataExecutive = await resExecutive.json();
        setReports(dataExecutive.reports || []);
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

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportTitle.trim() || !reportContent.trim()) return;

    try {
      setIsSubmittingReport(true);
      const res = await authenticatedFetch('/api/reports/executive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: reportTitle, content: reportContent }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to submit report.');
        return;
      }

      setReportTitle('');
      setReportContent('');
      setShowSubmitModal(false);
      await loadReportsData();
      alert('Report submitted to Owner successfully!');
    } catch (err) {
      console.error('Report submission error:', err);
      alert('Failed to submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  }

  if (isLoading || loadingData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tv-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tv-spinner" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)' }}>Loading Reports &amp; Analytics...</p>
        </div>
      </div>
    );
  }

  // Filter performance breakdown by role hierarchy:
  // MANAGER sees ONLY RECEPTIONISTS
  // OWNER sees MANAGERS and RECEPTIONISTS
  const filteredStaffActivity = staffActivity.filter((member) => {
    if (staff?.role === 'MANAGER') {
      return member.role === 'RECEPTIONIST';
    }
    if (staff?.role === 'OWNER') {
      return member.role === 'MANAGER' || member.role === 'RECEPTIONIST';
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tv-bg)', color: 'var(--tv-text)' }}>
      <Navigation />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
          <div>
            <span className="tv-label">Management Analytics</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--tv-text)', marginTop: '0.25rem' }}>
              Activity &amp; Executive Reports
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', marginTop: '0.25rem' }}>
              Staff performance metrics, manager executive reports, and financial reconciliation
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Manager Submit Report Button */}
            {staff?.role === 'MANAGER' && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="tv-btn tv-btn-gold"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.8rem' }}
              >
                📝 Submit Executive Report to Owner
              </button>
            )}

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

        {/* Executive Manager Reports Inbox Section */}
        <div className="tv-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--tv-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {staff?.role === 'MANAGER' ? '📩 Executive Reports Submitted to Owner' : '📩 Manager Executive Reports Inbox'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', marginTop: '0.2rem' }}>
                {staff?.role === 'MANAGER'
                  ? 'Operational summaries, shift notes, and executive updates submitted by you to the Owner'
                  : 'Operational summaries, shift notes, and executive submissions received from Managers'}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {staff?.role === 'MANAGER' && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="tv-btn tv-btn-gold"
                  style={{ padding: '0.45rem 0.95rem', fontSize: '0.75rem' }}
                >
                  ➕ Submit Executive Report
                </button>
              )}
              <span className="tv-badge-gold">{reports.length} Reports</span>
            </div>
          </div>

          {reports.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0' }}>
              {staff?.role === 'MANAGER'
                ? 'You haven\'t submitted any executive reports yet. Click "+ Submit Executive Report" above to send shift updates directly to the Owner.'
                : 'No executive reports received yet. Managers can submit shift notes and operational updates directly to your inbox.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => setViewingReport(rep)}
                  style={{
                    background: 'var(--tv-bg-raised)',
                    border: '1px solid var(--tv-border-md)',
                    borderRadius: '0.5rem',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                      <span className="tv-badge-pill" style={{ fontSize: '0.65rem' }}>{rep.submittedBy} ({rep.authorRole})</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>
                        {new Date(rep.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--tv-text)' }}>{rep.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '540px' }}>
                      {rep.content}
                    </p>
                  </div>
                  <button className="tv-btn tv-btn-ghost" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', flexShrink: 0 }}>
                    Read Full Report →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff Performance & Activity Table (Filtered by Role Hierarchy) */}
        <div className="tv-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--tv-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Staff Member Performance Breakdown
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)', marginTop: '0.15rem' }}>
                {staff?.role === 'MANAGER' ? 'Showing Receptionist staff activity breakdown' : 'Showing Manager & Receptionist activity breakdown'}
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>
              Showing {filteredStaffActivity.length} staff records
            </span>
          </div>

          {filteredStaffActivity.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
              No staff activity records found for this role filter.
            </p>
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
                  {filteredStaffActivity.map((member) => (
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

      {/* Modal: Submit Executive Report */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(11,15,25,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--tv-bg-card)', border: '1px solid var(--tv-border-lg)', borderRadius: 'var(--tv-radius-lg)', maxWidth: '580px', width: '100%', padding: '1.75rem', boxShadow: 'var(--tv-shadow-lg)' }}>
            <h2 className="tv-serif" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--tv-text)', marginBottom: '0.35rem' }}>
              Submit Executive Report to Owner
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', marginBottom: '1.25rem' }}>
              Send daily shift notes, revenue updates, or operational incidents directly to the Owner's reports inbox.
            </p>

            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                  Report Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="tv-input"
                  style={{ padding: '0.75rem', fontSize: '0.85rem' }}
                  placeholder="e.g. Daily Shift & Revenue Summary - Aug 27"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                  Detailed Operational Notes *
                </label>
                <textarea
                  rows={5}
                  required
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  className="tv-input"
                  style={{ padding: '0.75rem', fontSize: '0.85rem', resize: 'none' }}
                  placeholder="Occupancy highlights, guest feedback, maintenance issues resolved, cash collections..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowSubmitModal(false)} className="tv-btn tv-btn-ghost" style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingReport} className="tv-btn tv-btn-gold" style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem', opacity: isSubmittingReport ? 0.6 : 1 }}>
                  {isSubmittingReport ? 'Submitting...' : 'Send to Owner 📨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Read Executive Report */}
      {viewingReport && (
        <div onClick={() => setViewingReport(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(11,15,25,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--tv-bg-card)', border: '1px solid var(--tv-border-lg)', borderRadius: 'var(--tv-radius-lg)', maxWidth: '640px', width: '100%', padding: '1.75rem', boxShadow: 'var(--tv-shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--tv-border-md)', paddingBottom: '0.75rem' }}>
              <div>
                <span className="tv-badge-gold">{viewingReport.submittedBy} ({viewingReport.authorRole})</span>
                <h2 className="tv-serif" style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--tv-text)', marginTop: '0.35rem' }}>
                  {viewingReport.title}
                </h2>
                <span style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>
                  Submitted on {new Date(viewingReport.createdAt).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setViewingReport(null)} style={{ background: 'none', border: 'none', color: 'var(--tv-text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: 'var(--tv-bg-raised)', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid var(--tv-border-md)', minHeight: '160px', whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--tv-text-soft)', marginBottom: '1.25rem' }}>
              {viewingReport.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingReport(null)} className="tv-btn tv-btn-ghost" style={{ padding: '0.55rem 1.5rem', fontSize: '0.8rem' }}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
