import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from './not-found';
import AdminNotFound from './(admin)/not-found';

describe('NotFound (root)', () => {
  it('shows branded 404 content', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    // Brand mark is present so a logged-out 404 still looks on-brand.
    expect(screen.getByText('ContractorOS')).toBeInTheDocument();
  });

  it('routes the primary action to "/" so it is safe in any auth state', () => {
    render(<NotFound />);
    const cta = screen.getByRole('link', { name: /back to home/i });
    expect(cta).toHaveAttribute('href', '/');
  });
});

describe('AdminNotFound', () => {
  it('renders inside the admin shell and links back to the dashboard', () => {
    render(<AdminNotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /go to dashboard/i }),
    ).toHaveAttribute('href', '/dashboard');
  });
});
