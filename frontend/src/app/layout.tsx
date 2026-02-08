import type { Metadata } from 'next';
import { PageTransition } from '@/components/layout/PageTransition';
import { CursorTrailWrapper } from '@/components/layout/CursorTrailWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portfolio Dashboard | LLM Journal',
  description: 'Real-time portfolio analytics, stock charts, and trading insights',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background">
        <CursorTrailWrapper />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
