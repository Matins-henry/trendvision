'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@hotel/auth';

export interface GuestItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface GuestSearchSelectProps {
  selectedGuest: GuestItem | null;
  onSelectGuest: (guest: GuestItem) => void;
}

export function GuestSearchSelect({ selectedGuest, onSelectGuest }: GuestSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<GuestItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New guest form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingGuestConflict, setExistingGuestConflict] = useState<GuestItem | null>(null);

  // Fetch guests based on search term
  useEffect(() => {
    if (showCreateForm) return;

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await authenticatedFetch(`/api/guests?q=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.guests || []);
        }
      } catch (err) {
        console.error('Search guest error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, showCreateForm]);

  async function handleCreateGuest(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setExistingGuestConflict(null);

    if (!newName.trim()) {
      setErrorMessage('Guest name is required.');
      return;
    }

    if (!newEmail.trim() && !newPhone.trim()) {
      setErrorMessage('Please provide at least one contact method (email or phone).');
      return;
    }

    try {
      setIsCreating(true);
      const res = await authenticatedFetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create guest.');
        if (data.existingGuest) {
          setExistingGuestConflict(data.existingGuest);
        }
        return;
      }

      onSelectGuest(data.guest);
      setShowCreateForm(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
    } catch (err) {
      console.error('Create guest error:', err);
      setErrorMessage('An error occurred while creating guest.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)' }}>
          Guest Information <span style={{ color: 'var(--tv-danger)' }}>*</span>
        </label>
        <button
          type="button"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setErrorMessage('');
          }}
          style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--tv-gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {showCreateForm ? '← Search Existing Guests' : '+ Register New Guest'}
        </button>
      </div>

      {selectedGuest && selectedGuest.id && !showCreateForm && (
        <div style={{ padding: '0.875rem 1rem', background: 'var(--tv-gold-pale)', border: '1px solid var(--tv-gold-pale-md)', borderRadius: 'var(--tv-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--tv-text)' }}>{selectedGuest.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', marginTop: '2px' }}>
              {selectedGuest.email && <span>📧 {selectedGuest.email}</span>}
              {selectedGuest.email && selectedGuest.phone && <span style={{ margin: '0 0.4rem' }}>•</span>}
              {selectedGuest.phone && <span>📞 {selectedGuest.phone}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectGuest({ id: '', name: '', email: null, phone: null })}
            style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--tv-text)', background: 'var(--tv-bg-raised)', border: '1px solid var(--tv-border-md)', padding: '0.35rem 0.75rem', borderRadius: '0.4rem', cursor: 'pointer' }}
          >
            Change
          </button>
        </div>
      )}

      {showCreateForm ? (
        <div style={{ padding: '1rem', background: 'var(--tv-bg-raised)', border: '1px solid var(--tv-border-md)', borderRadius: 'var(--tv-radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--tv-text)' }}>New Guest Registration</p>
          {errorMessage && (
            <div style={{ padding: '0.75rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: '0.5rem', color: 'var(--tv-danger)', fontSize: '0.75rem' }}>
              <p>⚠️ {errorMessage}</p>
              {existingGuestConflict && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectGuest(existingGuestConflict);
                    setShowCreateForm(false);
                    setErrorMessage('');
                    setExistingGuestConflict(null);
                  }}
                  style={{ marginTop: '0.5rem', padding: '0.35rem 0.75rem', background: 'var(--tv-gold)', color: '#0B0F19', border: 'none', borderRadius: '0.4rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Use Existing Record ({existingGuestConflict.name}) →
                </button>
              )}
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', color: 'var(--tv-text-muted)', marginBottom: '0.35rem' }}>Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Chief Adeleke Johnson"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="tv-input"
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', color: 'var(--tv-text-muted)', marginBottom: '0.35rem' }}>Email</label>
              <input
                type="email"
                placeholder="adeleke@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="tv-input"
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', color: 'var(--tv-text-muted)', marginBottom: '0.35rem' }}>Phone</label>
              <input
                type="text"
                placeholder="+234 801 234 5678"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="tv-input"
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="tv-btn tv-btn-ghost"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateGuest}
              disabled={isCreating}
              className="tv-btn tv-btn-primary"
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.75rem' }}
            >
              {isCreating ? 'Saving...' : 'Save & Select Guest'}
            </button>
          </div>
        </div>
      ) : (
        (!selectedGuest || !selectedGuest.id) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Search by guest name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tv-input"
              style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}
            />
            <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--tv-border-md)', borderRadius: 'var(--tv-radius-sm)', background: 'var(--tv-bg-input)' }}>
              {isSearching ? (
                <div style={{ padding: '0.875rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--tv-text-muted)' }}>Searching guests...</div>
              ) : results.length === 0 ? (
                <div style={{ padding: '0.875rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--tv-text-muted)' }}>
                  No matching guests found.{' '}
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    style={{ color: 'var(--tv-gold)', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginLeft: '4px' }}
                  >
                    Create new guest
                  </button>
                </div>
              ) : (
                results.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => onSelectGuest(guest)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.65rem 0.85rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--tv-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--tv-text)',
                      transition: 'background 150ms ease',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--tv-text)' }}>{guest.name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>
                        {guest.email || 'No email'} {guest.phone ? `• ${guest.phone}` : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--tv-gold)' }}>Select →</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
