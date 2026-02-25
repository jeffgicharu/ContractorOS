import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Invoice Details' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
