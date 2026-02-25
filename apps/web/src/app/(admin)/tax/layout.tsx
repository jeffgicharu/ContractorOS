import type { Metadata } from 'next';

export const metadata: Metadata = { title: '1099 Readiness' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
