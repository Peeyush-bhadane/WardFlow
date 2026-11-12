import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WardFlow | Virus Quarantine Centre',
  description: 'Clinical workflow system for virus quarantine ward management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ibmPlexSans.variable}>
      <body className="min-h-screen bg-clinical-bg text-clinical-text font-sans antialiased selection:bg-[#E6F0F0] selection:text-[#0F6B6B]">
        {children}
      </body>
    </html>
  );
}
