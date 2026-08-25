'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentStaff, authenticatedFetch } from '@hotel/auth';
import { Navigation } from '@/components/Navigation';

import { BookingsHeaderStats } from '@/components/bookings/BookingsHeaderStats';
import { BookingsFilterToolbar } from '@/components/bookings/BookingsFilterToolbar';
import { BookingsTable, BookingListItemDTO } from '@/components/bookings/BookingsTable';
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal';
import { EditBookingModal } from '@/components/bookings/EditBookingModal';
import { BookingDetailsModal } from '@/components/bookings/BookingDetailsModal';

interface RoomOption {
  id: string;
  number: string;
  type: string;
  baseRate: number | string;
  status: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Data state
  const [bookings, setBookings] = useState<BookingListItemDTO[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    checkedOut: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingListItemDTO | null>(null);
  const [viewingBooking, setViewingBooking] = useState<BookingListItemDTO | null>(null);

  // Load rooms for creation/editing dropdowns
  const loadRooms = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error('Failed to load rooms for booking page:', err);
    }
  }, []);

  // Load bookings list and statistics
  const loadBookings = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== 'ALL') {
        params.append('status', selectedStatus);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await authenticatedFetch(`/api/bookings?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load bookings');
      }

      setBookings(data.bookings || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  // Auth & Access check on mount
  useEffect(() => {
    async function checkAccess() {
      try {
        const staff = await getCurrentStaff();
        if (!staff) {
          router.push('/login');
          return;
        }

        // RECEPTIONIST, MANAGER, and OWNER can access /bookings
        if (!['RECEPTIONIST', 'MANAGER', 'OWNER'].includes(staff.role)) {
          router.push('/access-denied');
          return;
        }

        setUserRole(staff.role);
        await Promise.all([loadRooms(), loadBookings()]);
      } catch (err) {
        console.error('Access check error:', err);
        setError('Failed to verify user credentials');
        setLoading(false);
      }
    }

    checkAccess();
  }, [router, loadRooms, loadBookings]);

  // Handle direct status changes from table or details drawer
  async function handleQuickStatusChange(bookingId: string, targetStatus: 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED') {
    if (targetStatus === 'CANCELLED') {
      const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
      if (!confirmCancel) return;
    }

    try {
      const res = await authenticatedFetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update status');
        return;
      }

      await loadBookings();
    } catch (err) {
      console.error('Status update error:', err);
      alert('An error occurred while updating status.');
    }
  }

  const canEdit = userRole === 'RECEPTIONIST' || userRole === 'MANAGER' || userRole === 'OWNER';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tv-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tv-spinner" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)' }}>Verifying access & loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tv-bg)', color: 'var(--tv-text)' }}>
      <Navigation />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Page Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <div>
            <span className="tv-label">Hotel Operations</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--tv-text)', marginTop: '0.25rem', letterSpacing: '-0.01em' }}>Booking Management</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', marginTop: '0.25rem' }}>Manage guest reservations, room availability and stay lifecycles</p>
          </div>
          <span className="tv-badge-gold">{userRole}</span>
        </div>

        {error && (
          <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: '0.75rem', color: 'var(--tv-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tv-danger)' }}>✕</button>
          </div>
        )}

        {/* Top Summary Metrics Cards */}
        <BookingsHeaderStats stats={stats} />

        {/* Search & Filter Toolbar */}
        <BookingsFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          canCreate={canEdit}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        {/* Bookings Data Table */}
        <BookingsTable
          bookings={bookings}
          isLoading={isRefreshing}
          canEdit={canEdit}
          onSelectBooking={setViewingBooking}
          onOpenEdit={setEditingBooking}
          onStatusChange={handleQuickStatusChange}
        />
      </main>

      {/* Modals */}
      <CreateBookingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadBookings}
        rooms={rooms}
      />

      <EditBookingModal
        booking={editingBooking}
        isOpen={!!editingBooking}
        onClose={() => setEditingBooking(null)}
        onSuccess={loadBookings}
        rooms={rooms}
      />

      <BookingDetailsModal
        booking={viewingBooking}
        isOpen={!!viewingBooking}
        onClose={() => setViewingBooking(null)}
        onRefresh={loadBookings}
        canEdit={canEdit}
        onOpenEdit={(b) => {
          setViewingBooking(null);
          setEditingBooking(b);
        }}
      />
    </div>
  );
}
