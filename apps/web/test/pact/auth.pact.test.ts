import { describe, it, expect } from 'vitest';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import {
  CONSUMER,
  PROVIDER,
  PACT_DIR,
  INVITE_TOKEN,
  PENDING_CONTRACTOR_ID,
} from './constants';

const { string, like } = MatchersV3;

const provider = new PactV3({
  consumer: CONSUMER,
  provider: PROVIDER,
  dir: PACT_DIR,
});

describe('Pact: POST /api/v1/auth/login', () => {
  it('200 + access token for valid credentials', async () => {
    provider
      .given('an admin user admin@org.test exists with password Password1')
      .uponReceiving('a login request with valid admin credentials')
      .withRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'admin@org.test', password: 'Password1' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          data: {
            accessToken: string('eyJhbGciOiJIUzI1NiJ9.payload.sig'),
            user: like({
              id: '00000000-0000-0000-0000-0000000000a1',
              email: 'admin@org.test',
              role: 'admin',
              orgId: '00000000-0000-0000-0000-000000000001',
              firstName: 'Admin',
              lastName: 'User',
            }),
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@org.test', password: 'Password1' }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: { accessToken: string; user: { role: string } } };
      expect(body.data.accessToken).toEqual(expect.any(String));
      expect(body.data.user.role).toBe('admin');
    });
  });

  it('401 + UNAUTHORIZED for wrong password', async () => {
    provider
      .given('an admin user admin@org.test exists and a wrong-password login is attempted')
      .uponReceiving('a login request with the wrong password')
      .withRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'admin@org.test', password: 'WrongPassword' },
      })
      .willRespondWith({
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: {
            code: 'UNAUTHORIZED',
            message: like('Invalid email or password'),
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@org.test', password: 'WrongPassword' }),
      });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });
});

describe('Pact: POST /api/v1/auth/invite/accept', () => {
  it('200 + access token for a valid pending invite', async () => {
    provider
      .given(
        `a contractor invite token ${INVITE_TOKEN} is pending for contractor ${PENDING_CONTRACTOR_ID}`,
      )
      .uponReceiving('an invite-accept request with valid token and password')
      .withRequest({
        method: 'POST',
        path: '/api/v1/auth/invite/accept',
        headers: { 'Content-Type': 'application/json' },
        body: {
          token: INVITE_TOKEN,
          password: 'StrongPass1',
          firstName: 'Casey',
          lastName: 'Contractor',
        },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          data: {
            accessToken: string('eyJhbGciOiJIUzI1NiJ9.payload.sig'),
            user: like({
              id: '00000000-0000-0000-0000-0000000000c2',
              email: 'invitee@org.test',
              role: 'contractor',
              orgId: '00000000-0000-0000-0000-000000000001',
              firstName: 'Casey',
              lastName: 'Contractor',
            }),
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/api/v1/auth/invite/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: INVITE_TOKEN,
          password: 'StrongPass1',
          firstName: 'Casey',
          lastName: 'Contractor',
        }),
      });
      expect(res.status).toBe(200);
    });
  });
});
