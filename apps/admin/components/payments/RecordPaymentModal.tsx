'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@hotel/auth';
import { PaymentMethodBadge } from './PaymentMethodBadge';
import { formatNaira } from '@/lib/currency';

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'ONLINE';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'TRANSFER', label: 'Bank Transfer' },
  { value: 'ONLINE', label: 'Online' },
];

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookingId: string;
  bookingReference: string;
  balanceOwing: number;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  bookingId,
  bookingReference,
  balanceOwing,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(balanceOwing > 0 ? balanceOwing.toFixed(2) : '');
      setMethod('CASH');
      setErrorMsg('');
    }
  }, [isOpen, balanceOwing]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const newBalance = isValidAmount ? Math.max(0, balanceOwing - parsedAmount) : balanceOwing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!isValidAmount) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authenticatedFetch(`/api/bookings/${bookingId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount, method }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to record payment.');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Record payment error:', err);
      setErrorMsg('An error occurred while recording the payment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'rgba(11, 15, 25, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#121827',
          color: '#FEFAF4',
          borderRadius: '1rem',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: '1px solid #1F2937',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ background: '#1A2234', padding: '1.25rem 1.5rem', borderBottom: '1px solid #2D3748', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#FEFAF4' }}>Record Staff Payment</h2>
            <p style={{ fontSize: '0.75rem', color: '#C8A97E', marginTop: '2px' }}>{bookingReference}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.2rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMsg && (
            <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: '0.5rem', color: '#FCA5A5', fontSize: '0.78rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Balance Context */}
          <div style={{ background: '#1A2234', padding: '1rem', borderRadius: '0.625rem', border: '1px solid #2D3748' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF' }}>
              Current Balance Owing
            </span>
            <p style={{ fontSize: '1.35rem', fontWeight: '800', color: balanceOwing > 0 ? '#FBBF24' : '#34D399', marginTop: '2px', fontFamily: 'Playfair Display, serif' }}>
              {formatNaira(balanceOwing)}
            </p>
          </div>

          {/* Amount Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#C8A97E', marginBottom: '0.35rem' }}>
              Payment Amount (₦) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="tv-input"
              style={{ padding: '0.75rem', fontSize: '0.88rem' }}
              autoFocus
            />
          </div>

          {/* Method Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#C8A97E', marginBottom: '0.35rem' }}>
              Payment Method *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {PAYMENT_METHODS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethod(value)}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '0.4rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: method === value ? '#C8A97E' : '#1A2234',
                    color: method === value ? '#1C1917' : '#9CA3AF',
                    border: method === value ? '1px solid #BE9B6B' : '1px solid #2D3748',
                    transition: 'all 150ms ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Balance Preview */}
          {isValidAmount && (
            <div style={{ background: '#1A2234', padding: '0.85rem 1rem', borderRadius: '0.5rem', border: '1px solid #2D3748', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
                <span>This Payment:</span>
                <span style={{ fontWeight: '700', color: '#34D399' }}>{formatNaira(parsedAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FEFAF4', paddingTop: '0.4rem', borderTop: '1px solid #2D3748' }}>
                <span>Remaining Balance:</span>
                <span style={{ fontWeight: '800', color: newBalance === 0 ? '#34D399' : '#FBBF24' }}>
                  {formatNaira(newBalance)} {newBalance === 0 ? '✓ Settled' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="tv-btn tv-btn-ghost" style={{ flex: 1, padding: '0.65rem', fontSize: '0.8rem' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidAmount}
              className="tv-btn tv-btn-gold"
              style={{ flex: 1, padding: '0.65rem', fontSize: '0.8rem', opacity: isSubmitting || !isValidAmount ? 0.6 : 1 }}
            >
              {isSubmitting ? 'Recording...' : '💳 Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
