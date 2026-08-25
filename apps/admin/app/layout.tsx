import type { Metadata } from 'next';
import './globals.css';
import { StaffProvider } from '@hotel/auth';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Trend Vision – Hotel Admin Console',
  description: 'Trend Vision Hotel Admin Dashboard — Manage bookings, guests, rooms and staff.',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <StaffProvider>
            {children}
          </StaffProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}