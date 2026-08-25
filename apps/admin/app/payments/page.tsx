'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentStaff } from '@hotel/auth';
import { Navigation } from '@/components/Navigation';

/**
 * /payments — Stub page for Phase 4.
 *
 * Payment recording lives inside the Bookings module (BookingDetailsModal).
 * This page acts as a landing so the nav link doesn't 404, and will be
 * expanded into a full payment history / reconciliation view in a later phase.
 */
export default function PaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const staff = await getCurrentStaff();
      if (!staff) {
        router.push('/login');
        return;
      }
      if (!['RECEPTIONIST', 'MANAGER'].includes(staff.role)) {
        router.push('/access-denied');
        return;
      }
      setLoading(false);
    }
    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-700 border-t-transparent mb-2" />
          <p className="text-xs text-gray-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payments</h1>
          <p className="text-xs text-gray-500 mt-1">
            Payment recording and receipt generation
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">💳</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Payments are recorded within Bookings
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            To record a payment or download a receipt, open a booking from the Bookings
            page and use the Payments panel inside the booking details.
          </p>
          <Link
            href="/bookings"
            className="inline-flex items-center px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            📅 Go to Bookings
          </Link>
          <p className="text-[10px] text-gray-400 mt-8">
            A full payment history and reconciliation view is planned for a future phase.
          </p>
        </div>
      </main>
    </div>
  );
}
