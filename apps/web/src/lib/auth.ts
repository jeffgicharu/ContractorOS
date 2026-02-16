import { api, setAccessToken, setOnUnauthorized } from './api-client';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  orgId: string;
  firstName: string;
  lastName: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface RefreshResponse {
  accessToken: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
}

export async function refreshToken(): Promise<boolean> {
  try {
    const { data } = await api.post<RefreshResponse>('/auth/refresh');
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function validateInviteToken(token: string): Promise<{
  valid: boolean;
  contractor?: { firstName: string; lastName: string; email: string };
}> {
  const { data } = await api.get<{
    valid: boolean;
    contractor?: { firstName: string; lastName: string; email: string };
  }>('/auth/invite/validate', { token });
  return data;
}

export async function acceptInvite(
  token: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<AuthUser> {
  const { data } = await api.post<LoginResponse>('/auth/invite/accept', {
    token,
    password,
    firstName,
    lastName,
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}

export function initAuthRefresh() {
  setOnUnauthorized(refreshToken);
}

export type { AuthUser };
