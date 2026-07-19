import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { PageTransition } from '@/components/layout/PageTransition';
import { SplashGate } from '@/components/ui/SplashGate';
import { SWRProvider } from '@/components/providers/SWRProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portfolio Dashboard | LLM Journal',
  description: 'Real-time portfolio analytics, stock charts, and trading insights',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background">
        <AuthProvider>
          <SWRProvider>
            <SplashGate>
              <PageTransition>{children}</PageTransition>
              <Analytics />
            </SplashGate>
          </SWRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
