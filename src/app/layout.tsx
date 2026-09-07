import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'KUBIK HOME — Gestão & Orçamentação',
  description:
    'Plataforma de orçamentação e cálculo técnico de marcenaria da KUBIK HOME & LIFE FURNITURE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="antialiased h-screen overflow-hidden bg-gray-50 text-gray-900">
        <AppProvider>{children}</AppProvider>
        <Toaster position="top-right" richColors expand={false} />
        <Analytics />
      </body>
    </html>
  );
}
