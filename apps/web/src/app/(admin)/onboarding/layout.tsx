import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Onboarding Pipeline' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
