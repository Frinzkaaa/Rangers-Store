import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Rangers Store - POS & Kasir Thrifting Mall',
  description: 'Aplikasi kasir pintar dan POS thrifting mall & bazar dengan QRIS dinamis terkunci',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <div className="app-shell">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
