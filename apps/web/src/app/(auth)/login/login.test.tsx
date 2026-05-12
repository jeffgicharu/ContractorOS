import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '@/hooks/use-auth';
import LoginPage from './page';
import { ApiClientError } from '@/lib/api-client';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn(), replace: vi.fn() }),
}));

interface AuthShape {
  user: null;
  isLoading: false;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
}

function buildAuth(loginImpl?: AuthShape['login']): AuthShape {
  return {
    user: null,
    isLoading: false,
    login: loginImpl ?? vi.fn().mockResolvedValue({
      id: 'u-1',
      email: 'admin@org.test',
      role: 'admin',
      orgId: 'o-1',
      firstName: 'A',
      lastName: 'B',
    }),
    logout: vi.fn(),
  };
}

function renderPage(auth: AuthShape) {
  return render(
    <AuthContext.Provider value={auth as never}>
      <LoginPage />
    </AuthContext.Provider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('renders email and password inputs and the submit button', () => {
    renderPage(buildAuth());
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows a Zod validation error when email lacks a TLD', async () => {
    // "user@invalid" passes HTML5 type=email validation (has @) but fails
    // Zod's .email() which requires a domain with a TLD.
    const auth = buildAuth();
    renderPage(auth);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@invalid');
    await userEvent.type(screen.getByLabelText(/password/i), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('shows a Zod validation error when password is empty', async () => {
    const auth = buildAuth();
    renderPage(auth);
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@org.test');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('calls login() and routes admin users to /dashboard on success', async () => {
    const auth = buildAuth();
    renderPage(auth);
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@org.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith('admin@org.test', 'whatever');
    });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('routes contractor users to /portal/dashboard on success', async () => {
    const auth = buildAuth(
      vi.fn().mockResolvedValue({
        id: 'u-2',
        email: 'casey@org.test',
        role: 'contractor',
        orgId: 'o-1',
        firstName: 'C',
        lastName: 'C',
      }),
    );
    renderPage(auth);
    await userEvent.type(screen.getByLabelText(/email/i), 'casey@org.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/portal/dashboard');
    });
  });

  it('renders the API error message when login() throws ApiClientError', async () => {
    const auth = buildAuth(
      vi.fn().mockRejectedValue(
        new ApiClientError(401, { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }),
      ),
    );
    renderPage(auth);
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@org.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when login() throws a non-ApiClientError', async () => {
    const auth = buildAuth(vi.fn().mockRejectedValue(new Error('network down')));
    renderPage(auth);
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@org.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
  });
});
