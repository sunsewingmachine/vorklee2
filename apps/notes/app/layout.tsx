import type { Metadata } from 'next';
import { QueryProvider } from '@/contexts/QueryProvider';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';

export const metadata: Metadata = {
  title: 'Notes App - Vorklee2',
  description: 'Collaborative note-taking app for teams',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LocaleProvider>
          <QueryProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}


