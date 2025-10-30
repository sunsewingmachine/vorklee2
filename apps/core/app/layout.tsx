import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vorklee2 Core Platform',
  description: 'Multi-App SaaS Platform - Core',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


