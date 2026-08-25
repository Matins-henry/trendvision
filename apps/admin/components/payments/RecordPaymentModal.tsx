'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@hotel/auth';
import { PaymentMethodBadge } from './PaymentMethodBadge';

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
  /** Remaining balance owing — used as a convenience default for the amount field */
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

  // Pre-populate amount with balance owing when modal opens
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

    // Validate max 2 decimal places
    const amountStr = parsedAmount.toFixed(10);
    const decimalPart = amountStr.split('.')[1];
    const significantDecimals = decimalPart?.replace(/0+$/, '').length ?? 0;
    if (significantDecimals > 2) {
      setErrorMsg('Amount must have at most 2 decimal places.');
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
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-teal-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Record Payment</h2>
            <p className="text-xs text-teal-200 mt-0.5">{bookingReference}</p>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white text-xl font-bold p-1 rounded hover:bg-teal-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Balance context */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Balance Owing</p>
            <p className="text-2xl font-bold text-gray-900">${balanceOwing.toFixed(2)}</p>
          </div>

          {/* Amount field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none focus:border-teal-600"
                autoFocus
              />
            </div>
          </div>

          {/* Method selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethod(value)}
                  className={`
                    px-3 py-2 rounded-lg text-xs font-semibold border transition-all
                    ${method === value
                      ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-600 ring-offset-1'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Live balance preview */}
          {isValidAmount && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-1.5">
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Payment Preview</p>
              <div className="flex justify-between text-xs text-teal-700">
                <span>This payment:</span>
                <span className="font-bold">${parsedAmount.toFixed(2)} <PaymentMethodBadge method={method} /></span>
              </div>
              <div className="flex justify-between text-xs text-teal-700 pt-1 border-t border-teal-200">
                <span>New balance owing:</span>
                <span className={`font-bold ${newBalance === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  ${newBalance.toFixed(2)}
                  {newBalance === 0 ? ' ✓ Settled' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidAmount}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Recording...' : '💳 Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
