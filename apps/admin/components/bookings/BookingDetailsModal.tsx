'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { authenticatedFetch } from '@hotel/auth';
import { BookingStatusBadge } from './BookingStatusBadge';
import { BookingListItemDTO } from './BookingsTable';
import { PaymentMethodBadge } from '../payments/PaymentMethodBadge';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';
import { formatNaira } from '@/lib/currency';

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
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
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
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '1px solid #1F2937',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.75rem',
              background: '#1A2234',
              borderBottom: '1px solid #2D3748',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FEFAF4', letterSpacing: '0.02em' }}>
                {booking.reference}
              </h2>
              <BookingStatusBadge status={booking.status} />
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                fontSize: '1.25rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {/* Content Body */}
          <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {errorMsg && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: '0.5rem', color: '#FCA5A5', fontSize: '0.8rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Top Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Guest Details */}
              <div style={{ background: '#1A2234', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #2D3748' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C8A97E' }}>
                  Guest Contact Info
                </span>
                <p style={{ fontSize: '1rem', fontWeight: '800', color: '#FEFAF4', marginTop: '0.2rem' }}>
                  {booking.guest.name}
                </p>
                {booking.guest.email && <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.25rem' }}>📧 {booking.guest.email}</p>}
                {booking.guest.phone && <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.2rem' }}>📞 {booking.guest.phone}</p>}
              </div>

              {/* Room & Pricing Details */}
              <div style={{ background: '#1A2234', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #2D3748' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C8A97E' }}>
                  Room &amp; Nightly Rate
                </span>
                <p style={{ fontSize: '1rem', fontWeight: '800', color: '#C8A97E', marginTop: '0.2rem' }}>
                  Room {booking.room.number} ({booking.room.type})
                </p>
                <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                  {formatNaira(Number(booking.room.baseRate))} / night × {stayNights} {stayNights === 1 ? 'night' : 'nights'}
                </p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#FEFAF4', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid #2D3748', fontFamily: 'Playfair Display, serif' }}>
                  Total Stay: {formatNaira(Number(booking.totalAmount))}
                </p>
              </div>
            </div>

            {/* Date Timeline */}
            <div style={{ background: '#1A2234', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #2D3748', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Check-In</span>
                <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#FEFAF4', marginTop: '0.2rem' }}>
                  {checkInDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                  {checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Check-Out</span>
                <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#FEFAF4', marginTop: '0.2rem' }}>
                  {checkOutDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                  {checkOutDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Additional Metadata */}
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.75rem', borderTop: '1px solid #2D3748' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Booking Source:</span>
                <span style={{ fontWeight: '700', color: '#FEFAF4' }}>{booking.source}</span>
              </div>
              {booking.createdBy && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Created By Staff:</span>
                  <span style={{ fontWeight: '700', color: '#FEFAF4' }}>{booking.createdBy.name}</span>
                </div>
              )}
              {booking.notes && (
                <div style={{ marginTop: '0.5rem', background: '#1A2234', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #2D3748' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#C8A97E', textTransform: 'uppercase' }}>Guest Special Requests:</span>
                  <p style={{ fontSize: '0.8rem', color: '#E5E7EB', marginTop: '0.2rem' }}>{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Payment Summary Section */}
            <div style={{ background: '#1A2234', borderRadius: '0.75rem', border: '1px solid #2D3748', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C8A97E' }}>
                  💳 Financial Balance Summary
                </span>
                {canEdit && (
                  <button
                    onClick={() => setIsRecordPaymentOpen(true)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: '#1C1917',
                      backgroundColor: '#C8A97E',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Record Payment
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#121827', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.62rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Total Due</span>
                  <p style={{ fontSize: '0.95rem', fontWeight: '800', color: '#FEFAF4', marginTop: '2px' }}>
                    {formatNaira(paymentSummary.totalAmount)}
                  </p>
                </div>
                <div style={{ background: '#121827', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.62rem', color: '#34D399', textTransform: 'uppercase' }}>Total Paid</span>
                  <p style={{ fontSize: '0.95rem', fontWeight: '800', color: '#34D399', marginTop: '2px' }}>
                    {formatNaira(paymentSummary.totalPaid)}
                  </p>
                </div>
                <div style={{ background: '#121827', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.62rem', color: paymentSummary.balanceOwing > 0 ? '#FBBF24' : '#34D399', textTransform: 'uppercase' }}>Balance Owing</span>
                  <p style={{ fontSize: '0.95rem', fontWeight: '800', color: paymentSummary.balanceOwing > 0 ? '#FBBF24' : '#34D399', marginTop: '2px' }}>
                    {formatNaira(paymentSummary.balanceOwing)}
                  </p>
                </div>
              </div>

              {/* Payments History List */}
              {isLoadingPayments ? (
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', padding: '0.5rem 0' }}>Loading payment logs...</p>
              ) : payments.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', padding: '0.5rem 0' }}>No payments logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {payments.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#121827', padding: '0.55rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '700', color: '#FEFAF4' }}>{formatNaira(Number(p.amount))}</span>
                        <PaymentMethodBadge method={p.method} />
                      </div>
                      <button
                        onClick={() => handleDownloadReceipt(p.id)}
                        style={{ background: 'none', border: 'none', color: '#C8A97E', fontWeight: '700', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        📄 Receipt PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Toolbar */}
            {canEdit && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #2D3748' }}>
                {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange('CHECKED_IN')}
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.78rem', fontWeight: '700', color: '#1C1917', backgroundColor: '#34D399', border: 'none', borderRadius: '0.35rem', cursor: 'pointer' }}
                  >
                    ✅ Check In Guest
                  </button>
                ) : null}

                {booking.status === 'CHECKED_IN' ? (
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange('CHECKED_OUT')}
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.78rem', fontWeight: '700', color: '#1C1917', backgroundColor: '#C8A97E', border: 'none', borderRadius: '0.35rem', cursor: 'pointer' }}
                  >
                    🚪 Check Out Guest
                  </button>
                ) : null}

                {booking.status !== 'CANCELLED' && booking.status !== 'CHECKED_OUT' ? (
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange('CANCELLED')}
                    style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', fontWeight: '700', color: '#FCA5A5', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: '0.35rem', cursor: 'pointer' }}
                  >
                    🚫 Cancel
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Sub-Modal */}
      {isRecordPaymentOpen && (
        <RecordPaymentModal
          bookingId={booking.id}
          bookingReference={booking.reference}
          balanceOwing={paymentSummary.balanceOwing}
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          onSuccess={() => {
            loadPayments();
            onRefresh();
          }}
        />
      )}
    </>
  );
}
