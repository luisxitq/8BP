import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ItachiEngine · License Panel',
  description: 'ItachiEngine admin panel for license keys',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ItachiEngine',
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#070708',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="overflow-x-hidden">{children}</body>
    </html>
  );
}
