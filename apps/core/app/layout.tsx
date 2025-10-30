import type { Metadata } from 'next';
import { ThemeProvider } from '@/contexts/ThemeProvider';

export const metadata: Metadata = {
  title: 'Vorklee2 Core Platform',
  description: 'Multi-App SaaS Platform - Core Services',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}


