'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentStaff, authenticatedFetch } from '@hotel/auth';
import { Navigation } from '@/components/Navigation';
import { formatNaira } from '@/lib/currency';

interface RateRule {
  id: string;
  name: string;
  roomType: string | null;
  startDate: string | null;
  endDate: string | null;
  daysOfWeek: number[];
  adjustmentType: 'PERCENTAGE' | 'FLAT_AMOUNT';
  adjustmentValue: number;
  active: boolean;
  createdAt: string;
}

interface NightlyBreakdown {
  date: string;
  dayName: string;
  baseRate: number;
  finalRate: number;
  appliedRules: string[];
}

interface CalculationResult {
  baseRate: number;
  stayNights: number;
  totalStayPrice: number;
  nightlyBreakdown: NightlyBreakdown[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<RateRule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Live Calculator State
  const [calcBaseRate, setCalcBaseRate] = useState<number>(150000);
  const [calcRoomType, setCalcRoomType] = useState<string>('ALL');
  const [calcCheckIn, setCalcCheckIn] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [calcCheckOut, setCalcCheckOut] = useState<string>(() => {
    const next = new Date();
    next.setDate(next.getDate() + 3);
    return next.toISOString().split('T')[0];
  });
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const loadRules = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/rates');
      if (!res.ok) throw new Error('Failed to fetch rate rules');
      const data = await res.json();
      setRules(data.rules || []);
    } catch (err) {
      console.error('Load rate rules error:', err);
      setError('Failed to load rate rules');
    }
  }, []);

  useEffect(() => {
    async function checkAccess() {
      try {
        const staff = await getCurrentStaff();

        if (!staff) {
          router.push('/login');
          return;
        }

        if (staff.role !== 'MANAGER' && staff.role !== 'OWNER') {
          router.push('/access-denied');
          return;
        }

        setUserRole(staff.role);
        await loadRules();
        setLoading(false);
      } catch (err) {
        console.error('Access check error:', err);
        setError('Failed to verify access');
        setLoading(false);
      }
    }

    checkAccess();
  }, [router, loadRules]);

  async function handleToggleRule(id: string) {
    try {
      await authenticatedFetch(`/api/rates/${id}`, { method: 'PATCH' });
      await loadRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
      alert('Failed to update rule status');
    }
  }

  async function handleDeleteRule(id: string) {
    if (!confirm('Are you sure you want to delete this rate rule?')) return;
    try {
      await authenticatedFetch(`/api/rates/${id}`, { method: 'DELETE' });
      await loadRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
      alert('Failed to delete rule');
    }
  }

  async function runPriceCalculation() {
    try {
      setCalculating(true);
      const res = await fetch('/api/public/rates/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseRate: calcBaseRate,
          roomType: calcRoomType !== 'ALL' ? calcRoomType : null,
          checkIn: calcCheckIn,
          checkOut: calcCheckOut,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Calculation failed');

      setCalcResult(data);
    } catch (err: any) {
      console.error('Calc error:', err);
      alert(err.message || 'Failed to calculate stay price');
    } finally {
      setCalculating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tv-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tv-spinner" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)' }}>Loading rate management rules...</p>
        </div>
      </div>
    );
  }

  const activeRulesCount = rules.filter((r) => r.active).length;
  const weekendRulesCount = rules.filter((r) => r.daysOfWeek && r.daysOfWeek.length > 0).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tv-bg)', color: 'var(--tv-text)' }}>
      <Navigation />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span className="tv-label">DYNAMIC PRICING SYSTEM</span>
            <h1 className="tv-serif" style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--tv-text)', marginTop: '0.2rem' }}>
              Room Rate & Seasonal Rules
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', marginTop: '0.2rem' }}>
              Configure seasonal date surges, weekend rate multipliers, and preview stay calculations in real-time
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="tv-badge-gold">{userRole}</span>
            <button onClick={() => setShowModal(true)} className="tv-btn tv-btn-gold" style={{ padding: '0.65rem 1.25rem', fontSize: '0.82rem' }}>
              + Create Rate Rule
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius-sm)', color: 'var(--tv-danger)', fontSize: '0.8rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <div className="tv-card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-text-muted)' }}>Configured Rules</span>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--tv-text)', marginTop: '0.2rem', fontFamily: 'Playfair Display, serif' }}>{rules.length} Rules</p>
          </div>
          <div className="tv-card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-success)' }}>Active Adjustments</span>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--tv-success)', marginTop: '0.2rem', fontFamily: 'Playfair Display, serif' }}>{activeRulesCount} Active</p>
          </div>
          <div className="tv-card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)' }}>Weekend Rules</span>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--tv-gold-b)', marginTop: '0.2rem', fontFamily: 'Playfair Display, serif' }}>{weekendRulesCount} Rules</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
          {/* Section 1: Rate Rules List */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 className="tv-serif" style={{ fontSize: '1.35rem', fontWeight: '700' }}>Configured Pricing Rules</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)' }}>Rules automatically apply to bookings</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="tv-card"
                  style={{
                    padding: '1.35rem',
                    opacity: rule.active ? 1 : 0.65,
                    borderLeft: rule.active ? '4px solid var(--tv-gold)' : '4px solid var(--tv-border-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--tv-text)' }}>{rule.name}</h3>
                      <span className="tv-badge-pill" style={{ fontSize: '0.65rem', marginTop: '0.3rem' }}>
                        {rule.roomType ? `${rule.roomType} Suites` : 'All Room Categories'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={rule.active ? 'tv-badge-forest' : 'tv-badge-gold'}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {rule.active ? '● Active' : '○ Paused'}
                    </button>
                  </div>

                  <div style={{ background: 'var(--tv-bg-raised)', padding: '0.85rem 1rem', borderRadius: 'var(--tv-radius-sm)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--tv-text-muted)' }}>Price Adjustment:</span>
                      <span style={{ fontWeight: '700', color: 'var(--tv-gold-b)' }}>
                        {rule.adjustmentType === 'PERCENTAGE' ? `+${rule.adjustmentValue}%` : `+${formatNaira(rule.adjustmentValue)}`}
                      </span>
                    </div>

                    {rule.daysOfWeek && rule.daysOfWeek.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--tv-text-muted)' }}>Applicable Days:</span>
                        <span style={{ fontWeight: '600' }}>
                          {rule.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')}
                        </span>
                      </div>
                    )}

                    {rule.startDate && rule.endDate && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--tv-text-muted)' }}>Seasonal Window:</span>
                        <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>
                          {rule.startDate} to {rule.endDate}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="tv-btn tv-btn-ghost"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', color: 'var(--tv-danger)' }}
                    >
                      Delete Rule 🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Interactive Live Price Calculator Tool */}
          <section style={{ background: 'var(--tv-bg-card)', border: '1px solid var(--tv-border-md)', borderRadius: 'var(--tv-radius-lg)', padding: '2rem', boxShadow: 'var(--tv-shadow-sm)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="tv-label">SIMULATION & VALIDATION TOOL</span>
              <h2 className="tv-serif" style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.2rem' }}>
                Live Stay Price Calculation Preview
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', marginTop: '0.2rem' }}>
                Test any stay date range to see how active seasonal rules and weekend multipliers adjust nightly pricing
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                  Base Nightly Rate (₦)
                </label>
                <input
                  type="number"
                  value={calcBaseRate}
                  onChange={(e) => setCalcBaseRate(Number(e.target.value))}
                  className="tv-input"
                  placeholder="150000"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                  Room Category
                </label>
                <select value={calcRoomType} onChange={(e) => setCalcRoomType(e.target.value)} className="tv-select">
                  <option value="ALL">All Categories</option>
                  <option value="Standard">Standard Suite</option>
                  <option value="Deluxe">Deluxe Parlor Suite</option>
                  <option value="Apartment">Full Mini Apartment</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                  Check-In Date
                </label>
                <input type="date" value={calcCheckIn} onChange={(e) => setCalcCheckIn(e.target.value)} className="tv-input" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                  Check-Out Date
                </label>
                <input type="date" value={calcCheckOut} onChange={(e) => setCalcCheckOut(e.target.value)} className="tv-input" />
              </div>
            </div>

            <button
              onClick={runPriceCalculation}
              disabled={calculating}
              className="tv-btn tv-btn-gold"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', justifyContent: 'center' }}
            >
              {calculating ? 'Calculating Stay Prices...' : '⚡ Calculate Dynamic Stay Breakdown'}
            </button>

            {/* Calculation Output Table */}
            {calcResult && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--tv-border-md)', paddingTop: '1.5rem', animation: 'tv-hero-text-in 300ms ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)' }}>
                      Total Stay ({calcResult.stayNights} {calcResult.stayNights === 1 ? 'Night' : 'Nights'})
                    </span>
                    <h3 className="tv-serif" style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--tv-gold-b)' }}>
                      {formatNaira(calcResult.totalStayPrice)}
                    </h3>
                  </div>

                  <span className="tv-badge-forest">
                    Average: {formatNaira(calcResult.totalStayPrice / calcResult.stayNights)} / night
                  </span>
                </div>

                {/* Nightly Breakdown Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--tv-bg-raised)', textAlign: 'left', borderBottom: '1px solid var(--tv-border-md)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Day</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Base Rate</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Applied Rate Adjustments</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Nightly Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calcResult.nightlyBreakdown.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--tv-border-md)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{item.date}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--tv-text-soft)' }}>{item.dayName}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--tv-text-muted)' }}>{formatNaira(item.baseRate)}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {item.appliedRules.length > 0 ? (
                              item.appliedRules.map((ruleText, rIdx) => (
                                <span key={rIdx} className="tv-badge-gold" style={{ fontSize: '0.62rem', marginRight: '0.4rem' }}>
                                  {ruleText}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: 'var(--tv-text-muted)', fontSize: '0.75rem' }}>Standard Base Rate</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '700', color: 'var(--tv-gold-b)' }}>
                            {formatNaira(item.finalRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Add Rate Rule Modal */}
      {showModal && (
        <AddRateRuleModal
          onClose={() => setShowModal(false)}
          onSave={async () => {
            await loadRules();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

/* Modal Component for Creating Rate Rules */
function AddRateRuleModal({ onClose, onSave }: { onClose: () => void; onSave: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [roomType, setRoomType] = useState('ALL');
  const [adjustmentType, setAdjustmentType] = useState<'PERCENTAGE' | 'FLAT_AMOUNT'>('PERCENTAGE');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(15);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(dayIdx: number) {
    if (selectedDays.includes(dayIdx)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIdx));
    } else {
      setSelectedDays([...selectedDays, dayIdx]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await authenticatedFetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          roomType: roomType !== 'ALL' ? roomType : null,
          adjustmentType,
          adjustmentValue: Number(adjustmentValue),
          startDate: startDate || null,
          endDate: endDate || null,
          daysOfWeek: selectedDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create rate rule');

      await onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to create rate rule');
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
      <div style={{ background: 'var(--tv-bg-card)', color: 'var(--tv-text)', borderRadius: 'var(--tv-radius-lg)', maxWidth: '540px', width: '100%', boxShadow: 'var(--tv-shadow-lg)', border: '1px solid var(--tv-border-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.75rem', background: 'var(--tv-bg-raised)', borderBottom: '1px solid var(--tv-border-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className="tv-badge-gold">PRICING ADJUSTMENT RULE</span>
            <h2 className="tv-serif" style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '0.2rem' }}>
              Create Rate Rule
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--tv-text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && <div style={{ padding: '0.75rem', background: 'var(--tv-danger-pale)', color: 'var(--tv-danger)', borderRadius: 'var(--tv-radius-sm)', fontSize: '0.8rem' }}>⚠️ {error}</div>}

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
              Rule Name *
            </label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="tv-input" placeholder="e.g. Easter Weekend Surge (+20%)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                Adjustment Type *
              </label>
              <select value={adjustmentType} onChange={(e: any) => setAdjustmentType(e.target.value)} className="tv-select">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT_AMOUNT">Flat Amount (₦)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                Value ({adjustmentType === 'PERCENTAGE' ? '%' : '₦'}) *
              </label>
              <input type="number" required value={adjustmentValue} onChange={(e) => setAdjustmentValue(Number(e.target.value))} className="tv-input" placeholder="15" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
              Target Room Category
            </label>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="tv-select">
              <option value="ALL">All Room Categories</option>
              <option value="Standard">Standard Suite</option>
              <option value="Deluxe">Deluxe Parlor Suite</option>
              <option value="Apartment">Full Mini Apartment</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
              Applicable Days of Week (Optional)
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {DAY_LABELS.map((day, idx) => {
                const selected = selectedDays.includes(idx);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      border: selected ? '1px solid var(--tv-gold)' : '1px solid var(--tv-border-md)',
                      background: selected ? 'var(--tv-gold-pale)' : 'var(--tv-bg-raised)',
                      color: selected ? 'var(--tv-gold-b)' : 'var(--tv-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                Start Date (Optional)
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="tv-input" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                End Date (Optional)
              </label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="tv-input" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--tv-border-md)' }}>
            <button type="button" onClick={onClose} disabled={saving} className="tv-btn tv-btn-ghost" style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem' }}>Cancel</button>
            <button type="submit" disabled={saving} className="tv-btn tv-btn-gold" style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating Rule...' : 'Save Rate Rule 🏷️'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
