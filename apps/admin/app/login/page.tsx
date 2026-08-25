'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@hotel/auth';
import { ThemeToggle } from '@/components/ThemeProvider';
import { BrandLogo } from '@/components/BrandLogo';

function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1 = Email step, 2 = Password slide-up step
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role detection based on user typing email
  const getDetectedRole = (emailStr: string) => {
    const e = emailStr.toLowerCase().trim();
    if (e.includes('owner')) {
      return {
        title: 'Hello Owner! 👋',
        badge: '👑 Executive Owner Access',
        desc: 'Full platform oversight, financial revenue analytics, maintenance control & staff management.',
      };
    }
    if (e.includes('manager')) {
      return {
        title: 'Hello Manager! 👋',
        badge: '💼 Operations Manager Access',
        desc: 'Room rates management, expense tracking, staff performance & detailed reports.',
      };
    }
    if (e.includes('reception') || e.includes('desk') || e.includes('staff')) {
      return {
        title: 'Hello Front Desk! 👋',
        badge: '🛎️ Receptionist Access',
        desc: 'Guest check-in queue, room reservations, keycard code lookup & payments recording.',
      };
    }
    return {
      title: 'Hello Trend Vision! 👋',
      badge: '✦ Staff Portal Access',
      desc: 'Seamless luxury hotel operations management. Enter your staff credentials to access your console.',
    };
  };

  const detected = getDetectedRole(email);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address to continue.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleQuickDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123'); // Standard test password
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const result = await signIn(email.trim(), password);

      const redirect = searchParams.get('redirect') || getDefaultRoute(result.role);
      window.location.href = redirect;
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err instanceof Error ? err.message : 'Invalid email or password');
      setLoading(false);
    }
  };

  const getDefaultRoute = (role: string) => {
    switch (role) {
      case 'OWNER':
        return '/dashboard';
      case 'MANAGER':
        return '/reports';
      case 'RECEPTIONIST':
        return '/bookings';
      default:
        return '/dashboard';
    }
  };

  const queryError = searchParams.get('error');

  return (
    <div className="tv-login-split-container">
      {/* ═══════════════════════════════════ LEFT PANEL (SALESSKIP BRANDING SHOWCASE) ═══════════════════════════════════ */}
      <div className="tv-login-left-brand">
        <div>
          <BrandLogo height={48} variant="dark" />
        </div>

        <div style={{ margin: '3rem 0' }}>
          <div key={detected.title} className="tv-role-fade">
            <span className="tv-badge-gold" style={{ marginBottom: '1.25rem', display: 'inline-flex' }}>
              {detected.badge}
            </span>
            <h1 className="tv-serif" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800', lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: '1.25rem' }}>
              {detected.title}
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(245,239,224,0.85)', maxWidth: '440px', lineHeight: 1.7 }}>
              {detected.desc}
            </p>
          </div>
        </div>

        <div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(245,239,224,0.5)' }}>
            © {new Date().getFullYear()} TREND VISION LTD. All rights reserved.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════ RIGHT PANEL (INTERACTIVE 2-STEP LOGIN FORM) ═══════════════════════════════════ */}
      <div
        style={{
          backgroundColor: 'var(--tv-bg)',
          color: 'var(--tv-text)',
          padding: '4rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Top Right Theme Toggle */}
        <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 20 }}>
          <ThemeToggle />
        </div>

        <div style={{ maxWidth: '420px', width: '100%' }}>
          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 className="tv-serif" style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--tv-text)', marginBottom: '0.4rem' }}>
              Welcome Back!
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--tv-text-muted)', lineHeight: 1.6 }}>
              {step === 1
                ? 'Enter your staff email address to get started.'
                : `Enter password for ${email}`}
            </p>
          </div>

          {/* Banners */}
          {queryError === 'inactive' && (
            <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius-sm)', color: 'var(--tv-danger)', fontSize: '0.8rem', textAlign: 'center' }}>
              ⚠️ Account is inactive. Contact system administrator.
            </div>
          )}

          {error && (
            <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius-sm)', color: 'var(--tv-danger)', fontSize: '0.8rem', textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1: EMAIL ALONE */}
          {step === 1 && (
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tv-gold)', marginBottom: '0.5rem' }}>
                  Staff Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="tv-input"
                  style={{ padding: '0.9rem 1rem', fontSize: '0.92rem' }}
                  placeholder="e.g. owner@hotel.com"
                />
              </div>

              <button
                type="submit"
                className="tv-btn tv-btn-primary"
                style={{ width: '100%', padding: '0.95rem', fontSize: '0.88rem', justifyContent: 'center' }}
              >
                Continue to Password →
              </button>
            </form>
          )}

          {/* STEP 2: PASSWORD SLIDE-UP ANIMATED FORM */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="tv-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Selected Email Card */}
              <div
                style={{
                  background: 'var(--tv-bg-raised)',
                  border: '1px solid var(--tv-border-md)',
                  borderRadius: 'var(--tv-radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--tv-text)' }}>{email}</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: 'var(--tv-gold)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Change ✎
                </button>
              </div>

              {/* Password Input (Slid up!) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tv-gold)', marginBottom: '0.5rem' }}>
                  Console Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="tv-input"
                  style={{ padding: '0.9rem 1rem', fontSize: '0.92rem' }}
                  placeholder="••••••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tv-btn tv-btn-primary"
                style={{ width: '100%', padding: '0.95rem', fontSize: '0.88rem', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Authenticating...' : 'Login to Admin Console 🔒'}
              </button>
            </form>
          )}

          {/* Quick 1-Click Demo Login Pills */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--tv-border-md)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-text-muted)', display: 'block', marginBottom: '0.875rem' }}>
              Quick Demo Staff Access:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('owner@hotel.com')}
                className="tv-chip"
              >
                👑 Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('manager@hotel.com')}
                className="tv-chip"
              >
                💼 Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('receptionist@hotel.com')}
                className="tv-chip"
              >
                🛎️ Receptionist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tv-bg)' }}>
          <div className="tv-spinner" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
