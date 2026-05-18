import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

let mockPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { firstName: 'Sarah', lastName: 'Chen', email: 'sarah@acme.test' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// The notification dropdown fetches over the network on mount; stub it so the
// Header renders in isolation.
vi.mock('@/components/notifications/notification-dropdown', () => ({
  NotificationDropdown: () => null,
}));

import { Header } from './header';

describe('Header', () => {
  beforeEach(() => {
    mockPathname = '/dashboard';
  });

  it('renders the search control as an accessible link to the contractor directory on admin routes', () => {
    mockPathname = '/dashboard';
    render(<Header />);

    const search = screen.getByRole('link', { name: /search contractors/i });
    expect(search).toHaveAttribute('href', '/contractors');
  });

  it('scopes the search control to invoices inside the contractor portal', () => {
    mockPathname = '/portal/dashboard';
    render(<Header />);

    const search = screen.getByRole('link', { name: /search invoices/i });
    expect(search).toHaveAttribute('href', '/portal/invoices');
  });

  it('exposes an accessible name on the mobile navigation toggle', () => {
    render(<Header onMenuToggle={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /open navigation menu/i }),
    ).toBeInTheDocument();
  });
});
