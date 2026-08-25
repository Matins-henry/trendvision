'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { authenticatedFetch } from '@hotel/auth';
import { BookingStatusBadge } from './BookingStatusBadge';
import { BookingListItemDTO } from './BookingsTable';
import { PaymentMethodBadge } from '../payments/PaymentMethodBadge';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';

interface BookingDetailsModalProps {
  booking: BookingListItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  canEdit: boolean;
  onOpenEdit: (booking: BookingListItemDTO) => void;
}

interface PaymentItem {
  id: string;
  amount: string | number;
  method: string;
  status: string;
  createdAt: string;
  handledBy: { id: string; name: string } | null;
}

interface PaymentSummary {
  totalAmount: number;
  totalPaid: number;
  balanceOwing: number;
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onRefresh,
  canEdit,
  onOpenEdit,
}: BookingDetailsModalProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payments state
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalAmount: 0,
    totalPaid: 0,
    balanceOwing: 0,
  });
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Re-load payments whenever this booking's modal opens
  const loadPayments = useCallback(async () => {
    if (!booking) return;
    setIsLoadingPayments(true);
    try {
      const res = await authenticatedFetch(`/api/bookings/${booking.id}/payments`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments ?? []);
        if (data.summary) setPaymentSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [booking]);

  useEffect(() => {
    if (isOpen && booking) {
      loadPayments();
    } else if (!isOpen) {
      // Reset when modal closes so stale data doesn't flash on next open
      setPayments([]);
      setPaymentSummary({ totalAmount: 0, totalPaid: 0, balanceOwing: 0 });
    }
  }, [isOpen, booking, loadPayments]);

  if (!isOpen || !booking) return null;

  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);

  const stayNights = Math.max(
    1,
    Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  async function handleStatusChange(targetStatus: 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED') {
    setErrorMsg('');
    if (targetStatus === 'CANCELLED') {
      const confirmCancel = window.confirm(`Are you sure you want to cancel booking ${booking?.reference}?`);
      if (!confirmCancel) return;
    }

    try {
      setIsUpdatingStatus(true);
      const res = await authenticatedFetch(`/api/bookings/${booking?.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update status.');
        return;
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error('Status update error:', err);
      setErrorMsg('An error occurred while updating booking status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  /**
   * Fetch receipt PDF with auth header and trigger browser download.
   * A plain <a href> cannot carry the Authorization Bearer token.
   */
  async function handleDownloadReceipt(paymentId: string) {
    if (!booking) return;
    try {
      const res = await authenticatedFetch(
        `/api/bookings/${booking.id}/payments/${paymentId}/receipt`
      );
      if (!res.ok) {
        alert('Failed to download receipt. Please try again.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${booking.reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Receipt download error:', err);
      alert('Failed to download receipt.');
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-teal-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold tracking-tight">{booking.reference}</h2>
            <BookingStatusBadge status={booking.status} />
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white text-xl font-bold p-1 rounded hover:bg-teal-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guest Details */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Guest Details</span>
              <p className="text-sm font-bold text-gray-900">{booking.guest.name}</p>
              {booking.guest.email && <p className="text-xs text-gray-600">📧 {booking.guest.email}</p>}
              {booking.guest.phone && <p className="text-xs text-gray-600">📞 {booking.guest.phone}</p>}
            </div>

            {/* Room & Pricing Details */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Room & Pricing</span>
              <p className="text-sm font-bold text-teal-800">
                Room {booking.room.number} ({booking.room.type})
              </p>
              <p className="text-xs text-gray-600">
                ${Number(booking.room.baseRate).toFixed(2)} / night × {stayNights} nights
              </p>
              <p className="text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                Total: ${Number(booking.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Date Timeline */}
          <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-100 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Check-In</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {checkInDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-500">
                {checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Check-Out</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {checkOutDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-500">
                {checkOutDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Additional Metadata */}
          <div className="text-xs space-y-1 text-gray-500 border-t border-gray-100 pt-4">
            <div className="flex justify-between">
              <span>Source:</span>
              <span className="font-semibold text-gray-700">{booking.source}</span>
            </div>
            {booking.createdBy && (
              <div className="flex justify-between">
                <span>Created By Staff:</span>
                <span className="font-semibold text-gray-700">{booking.createdBy.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Booked On:</span>
              <span className="font-semibold text-gray-700">
                {new Date(booking.createdAt).toLocaleString()}
              </span>
            </div>
            {booking.notes && (
              <div className="pt-2">
                <span className="font-semibold text-gray-700 block">Notes:</span>
                <p className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-700 mt-1 italic">
                  "{booking.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Payments Section */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Payments</p>
              {canEdit && booking.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(true)}
                  className="px-2.5 py-1 text-[10px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                >
                  + Record Payment
                </button>
              )}
            </div>

            {/* Balance summary strip */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-400">Total</p>
                <p className="text-sm font-bold text-gray-900">${paymentSummary.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Paid</p>
                <p className="text-sm font-bold text-emerald-700">${paymentSummary.totalPaid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Owing</p>
                <p className={`text-sm font-bold ${
                  paymentSummary.balanceOwing > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  ${paymentSummary.balanceOwing.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payment rows */}
            {isLoadingPayments ? (
              <p className="text-[10px] text-gray-400 text-center py-1 italic">Loading payments...</p>
            ) : payments.length === 0 ? (
              <p className="text-[10px] text-gray-400 text-center py-1 italic">No payments recorded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PaymentMethodBadge method={p.method} />
                      <span className="text-[10px] text-gray-500 truncate">
                        {new Date(p.createdAt).toLocaleString()}
                      </span>
                      {p.handledBy && (
                        <span className="text-[10px] text-gray-400 hidden sm:inline">· {p.handledBy.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-gray-900">${Number(p.amount).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(p.id)}
                        className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-2 transition-colors"
                        title="Download receipt PDF"
                      >
                        🧾 Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Lifecycle Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            {canEdit && (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(booking);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors"
              >
                ✏️ Edit Booking
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {canEdit && (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
              <>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange('CANCELLED')}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel Booking
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange('CHECKED_IN')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  ✅ Check In Guest
                </button>
              </>
            )}

            {canEdit && booking.status === 'CHECKED_IN' && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('CHECKED_OUT')}
                className="px-4 py-1.5 text-xs font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                🚪 Check Out Guest
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    <RecordPaymentModal
      isOpen={isRecordPaymentOpen}
      onClose={() => setIsRecordPaymentOpen(false)}
      onSuccess={() => {
        loadPayments();
        setIsRecordPaymentOpen(false);
      }}
      bookingId={booking.id}
      bookingReference={booking.reference}
      balanceOwing={paymentSummary.balanceOwing}
    />
    </>
  );
}
