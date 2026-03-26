import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spreads Analyst Workbench',
  description: 'POC UI for reviewing spreads, formulas, provenance, and exceptions.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
