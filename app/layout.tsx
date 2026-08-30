import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '8BP License Panel',
  description: 'Admin panel for 8 Ball Pool mod licenses',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '8BP Panel',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="overflow-x-hidden">{children}</body>
    </html>
  );
}
