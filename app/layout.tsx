import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '8BP License Panel',
  description: 'Admin panel for 8 Ball Pool mod licenses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
