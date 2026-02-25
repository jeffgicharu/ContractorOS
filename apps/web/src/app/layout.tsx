import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/providers/auth-provider';
import '@/styles/globals.css';

const siteUrl = 'https://contractoros.jeffgicharu.com';

export const metadata: Metadata = {
  title: {
    default: 'ContractorOS — Unified Contractor Lifecycle Platform',
    template: '%s | ContractorOS',
  },
  description:
    'Manage the full contractor lifecycle in one platform — onboarding, invoicing, classification risk monitoring, compliance documents, and offboarding. Built for teams managing 20–200 contractors.',
  metadataBase: new URL(siteUrl),
  keywords: [
    'contractor management',
    'contractor onboarding',
    'invoice management',
    'worker classification',
    'compliance management',
    '1099 management',
    'contractor lifecycle',
    'offboarding',
  ],
  authors: [{ name: 'Jeff Gicharu' }],
  creator: 'Jeff Gicharu',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'ContractorOS',
    title: 'ContractorOS — Unified Contractor Lifecycle Platform',
    description:
      'Manage the full contractor lifecycle in one platform — onboarding, invoicing, classification risk monitoring, compliance documents, and offboarding.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ContractorOS — Unified contractor lifecycle platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ContractorOS — Unified Contractor Lifecycle Platform',
    description:
      'Manage the full contractor lifecycle in one platform — onboarding, invoicing, classification risk, compliance docs, and offboarding.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;600;700&display=swap"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
