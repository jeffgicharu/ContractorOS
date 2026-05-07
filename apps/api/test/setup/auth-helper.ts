import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

export interface LoginResult {
  accessToken: string;
  refreshCookie: string;
}

export async function loginAs(
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoginResult> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  const setCookie = res.headers['set-cookie'];
  const cookies: string[] = Array.isArray(setCookie)
    ? setCookie
    : typeof setCookie === 'string'
      ? [setCookie]
      : [];
  const refreshCookie =
    cookies.find((c) => c.startsWith('refresh_token=')) ?? '';

  return {
    accessToken: res.body.data.accessToken as string,
    refreshCookie,
  };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
