import React from 'react';

interface BookingsStatsProps {
  stats: {
    total: number;
    confirmed: number;
    checkedIn: number;
    checkedOut: number;
    cancelled: number;
    totalRevenue: number | string;
  };
}

export function BookingsHeaderStats({ stats }: BookingsStatsProps) {
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(stats.totalRevenue) || 0);

  const cards = [
    {
      label: 'Total Bookings',
      value: stats.total,
      sub: 'All recorded reservations',
      icon: '📋',
      valueColor: 'var(--tv-text)',
      subColor: 'var(--tv-text-muted)',
    },
    {
      label: 'Active Stays',
      value: stats.checkedIn,
      sub: 'Currently in-house',
      icon: '🔑',
      valueColor: 'var(--tv-success)',
      subColor: 'var(--tv-success)',
    },
    {
      label: 'Upcoming Confirmed',
      value: stats.confirmed,
      sub: 'Awaiting check-in',
      icon: '📅',
      valueColor: '#60A5FA',
      subColor: '#60A5FA',
    },
    {
      label: 'Total Revenue',
      value: formattedRevenue,
      sub: 'Confirmed & completed stays',
      icon: '💵',
      valueColor: 'var(--tv-gold-b)',
      subColor: 'var(--tv-text-muted)',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {cards.map(card => (
        <div key={card.label} className="tv-stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tv-text-muted)', marginBottom: '0.25rem' }}>
                {card.label}
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: '800', color: card.valueColor, lineHeight: 1 }}>
                {card.value}
              </p>
            </div>
            <div style={{
              width: '44px', height: '44px',
              borderRadius: '12px',
              background: 'var(--tv-bg-raised)',
              border: '1px solid var(--tv-border-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem',
            }}>{card.icon}</div>
          </div>
          <p style={{ fontSize: '0.72rem', color: card.subColor, fontWeight: '500' }}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
