import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'KUBIK HOME — Gestão & Orçamentação',
  description:
    'Plataforma de orçamentação e cálculo técnico de marcenaria da KUBIK HOME & LIFE FURNITURE',
};

// viewportFit: 'cover' permite à aplicação usar o ecrã todo do telemóvel.
// As margens de segurança do entalhe são tratadas com env(safe-area-inset-*).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="antialiased h-[100dvh] overflow-hidden bg-gray-50 text-gray-900">
        <AppProvider>{children}</AppProvider>
        <Toaster position="top-right" richColors expand={false} />
      </body>
    </html>
  );
}
