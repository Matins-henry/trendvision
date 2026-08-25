'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaff } from '@hotel/auth';

export default function Home() {
  const router = useRouter();
  const { staff, isLoading } = useStaff();

  useEffect(() => {
    if (!isLoading) {
      if (!staff) {
        // Not authenticated, redirect to login
        router.push('/login');
      } else {
        // Authenticated, redirect based on role
        switch (staff.role) {
          case 'OWNER':
            router.push('/dashboard');
            break;
          case 'MANAGER':
            router.push('/reports');
            break;
          case 'RECEPTIONIST':
            router.push('/bookings');
            break;
          default:
            router.push('/login');
        }
      }
    }
  }, [staff, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tv-bg)' }}>
        <div className="tv-spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tv-bg)', color: 'var(--tv-text-muted)' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>Redirecting to portal...</div>
    </div>
  );
}
