import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EngagementForm } from './engagement-form';

const apiPostMock = vi.fn();

vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual<object>('@/lib/api-client');
  return {
    ...actual,
    api: { post: (...args: unknown[]) => apiPostMock(...args) },
  };
});

async function fillBaseFields(opts: { hourlyRate?: string; fixedRate?: string }) {
  await userEvent.type(screen.getByLabelText(/title/i), 'Q3 Engagement');
  await userEvent.type(screen.getByLabelText(/start date/i), '2026-07-01');
  if (opts.hourlyRate !== undefined) {
    await userEvent.type(screen.getByLabelText(/hourly rate/i), opts.hourlyRate);
  }
  if (opts.fixedRate !== undefined) {
    await userEvent.type(screen.getByLabelText(/fixed rate/i), opts.fixedRate);
  }
}

describe('EngagementForm', () => {
  beforeEach(() => {
    apiPostMock.mockReset().mockResolvedValue({ data: { id: 'eng-1' } });
  });

  it('renders the title, dates, rates, and payment-terms fields', () => {
    render(<EngagementForm contractorId="c-1" onSuccess={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hourly rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fixed rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment terms/i)).toBeInTheDocument();
  });

  it('shows a Zod validation error when neither hourly nor fixed rate is provided', async () => {
    render(<EngagementForm contractorId="c-1" onSuccess={vi.fn()} onCancel={vi.fn()} />);
    await fillBaseFields({});
    await userEvent.click(screen.getByRole('button', { name: /create engagement/i }));
    expect(
      await screen.findByText(/either hourly rate or fixed rate is required/i),
    ).toBeInTheDocument();
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it('submits successfully with an hourly rate and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    render(<EngagementForm contractorId="c-1" onSuccess={onSuccess} onCancel={vi.fn()} />);
    await fillBaseFields({ hourlyRate: '125' });
    await userEvent.click(screen.getByRole('button', { name: /create engagement/i }));
    await waitFor(() => expect(apiPostMock).toHaveBeenCalledTimes(1));
    expect(apiPostMock).toHaveBeenCalledWith(
      '/contractors/c-1/engagements',
      expect.objectContaining({ title: 'Q3 Engagement', hourlyRate: 125 }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('renders the api error message when the post fails', async () => {
    const { ApiClientError } = await import('@/lib/api-client');
    apiPostMock.mockRejectedValue(
      new ApiClientError(409, { code: 'CONFLICT', message: 'Engagement already exists' }),
    );
    render(<EngagementForm contractorId="c-1" onSuccess={vi.fn()} onCancel={vi.fn()} />);
    await fillBaseFields({ hourlyRate: '125' });
    await userEvent.click(screen.getByRole('button', { name: /create engagement/i }));
    expect(await screen.findByText(/engagement already exists/i)).toBeInTheDocument();
  });

  it('calls onCancel when the Cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<EngagementForm contractorId="c-1" onSuccess={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
    expect(apiPostMock).not.toHaveBeenCalled();
  });
});
