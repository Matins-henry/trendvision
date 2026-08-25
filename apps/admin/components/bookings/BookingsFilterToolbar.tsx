import React from 'react';

interface BookingsFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  canCreate: boolean;
  onOpenCreateModal: () => void;
}

const STATUS_TABS = [
  { id: 'ALL',        label: 'All Bookings' },
  { id: 'CONFIRMED',  label: 'Confirmed' },
  { id: 'CHECKED_IN', label: 'Checked In' },
  { id: 'CHECKED_OUT',label: 'Checked Out' },
  { id: 'CANCELLED',  label: 'Cancelled' },
];

export function BookingsFilterToolbar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  canCreate,
  onOpenCreateModal,
}: BookingsFilterToolbarProps) {
  return (
    <div style={{
      background: 'var(--tv-bg-card)',
      border: '1px solid var(--tv-border)',
      borderRadius: 'var(--tv-radius)',
      padding: '1rem 1.25rem',
      marginBottom: '1.25rem',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      boxShadow: 'var(--tv-shadow-sm)',
    }}>
      {/* Status Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflowX: 'auto', flexShrink: 0 }}>
        {STATUS_TABS.map(tab => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: isActive ? '1px solid var(--tv-gold-pale-md)' : '1px solid transparent',
                background: isActive ? 'var(--tv-gold-pale)' : 'transparent',
                color: isActive ? 'var(--tv-gold-b)' : 'var(--tv-text-muted)',
                transition: 'all 150ms ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right: Search + Create */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 auto', justifyContent: 'flex-end', minWidth: '0' }}>
        <div style={{ position: 'relative', flex: '0 1 260px', minWidth: '0' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem', pointerEvents: 'none', color: 'var(--tv-text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search ref, guest, room..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="tv-input"
            style={{ paddingLeft: '2.25rem', paddingRight: searchQuery ? '2rem' : '0.875rem', fontSize: '0.8rem', padding: '0.5rem 0.875rem 0.5rem 2.25rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--tv-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >✕</button>
          )}
        </div>

        {canCreate && (
          <button
            onClick={onOpenCreateModal}
            className="tv-btn tv-btn-primary"
            style={{ padding: '0.5rem 1.125rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
          >
            + New Booking
          </button>
        )}
      </div>
    </div>
  );
}
