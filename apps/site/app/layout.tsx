import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { FloatingMobileBar } from '@/components/FloatingMobileBar';

export const metadata: Metadata = {
  title: 'Trend Vision – Luxury Hotel & Apartments',
  description: 'Experience unmatched luxury at Trend Vision. Bedroom suites, deluxe parlor suites, and full mini apartments with private kitchens. VVIP lounge, swim-up pool bar.',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: apply theme from localStorage before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('trend_theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <FloatingMobileBar />
        </ThemeProvider>
      </body>
    </html>
  );
}