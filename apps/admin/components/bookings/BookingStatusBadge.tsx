import React from 'react';

export type BookingStatusType = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

interface BookingStatusBadgeProps { status: BookingStatusType | string; }

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  CONFIRMED:   { label: 'Confirmed',   bg: 'rgba(96,165,250,0.12)',  color: '#60A5FA', dot: '#3B82F6' },
  CHECKED_IN:  { label: 'Checked In',  bg: 'var(--tv-success-pale)', color: 'var(--tv-success)', dot: 'var(--tv-success)' },
  CHECKED_OUT: { label: 'Checked Out', bg: 'var(--tv-bg-raised)',    color: 'var(--tv-text-muted)', dot: 'var(--tv-text-dim)' },
  CANCELLED:   { label: 'Cancelled',   bg: 'var(--tv-danger-pale)',  color: 'var(--tv-danger)', dot: 'var(--tv-danger)' },
  PENDING:     { label: 'Pending',     bg: 'var(--tv-gold-pale)',    color: 'var(--tv-gold-b)', dot: 'var(--tv-gold)' },
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.2rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.68rem',
      fontWeight: '700',
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.dot}30`,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}
