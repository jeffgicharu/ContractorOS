import { describe, it, expect } from 'vitest';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { CONSUMER, PROVIDER, PACT_DIR, ADMIN_BEARER } from './constants';

const { string, like } = MatchersV3;

const provider = new PactV3({
  consumer: CONSUMER,
  provider: PROVIDER,
  dir: PACT_DIR,
});

describe('Pact: POST /api/v1/contractors', () => {
  it('201 + new contractor for a valid create payload', async () => {
    provider
      .given('an admin user admin@org.test exists with password Password1')
      .uponReceiving('an admin creating a new contractor with a unique email')
      .withRequest({
        method: 'POST',
        path: '/api/v1/contractors',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_BEARER}`,
        },
        body: {
          email: 'newhire@org.test',
          firstName: 'New',
          lastName: 'Hire',
          type: 'domestic',
        },
      })
      .willRespondWith({
        status: 201,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          data: {
            id: string('11111111-1111-1111-1111-111111111111'),
            email: 'newhire@org.test',
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/api/v1/contractors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_BEARER}`,
        },
        body: JSON.stringify({
          email: 'newhire@org.test',
          firstName: 'New',
          lastName: 'Hire',
          type: 'domestic',
        }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { data: { id: string; email: string } };
      expect(body.data.id).toEqual(expect.any(String));
      expect(body.data.email).toBe('newhire@org.test');
    });
  });

  it('400 VALIDATION_ERROR when the email is malformed', async () => {
    provider
      .given('an admin user admin@org.test exists with password Password1')
      .uponReceiving('an admin creating a contractor with a malformed email')
      .withRequest({
        method: 'POST',
        path: '/api/v1/contractors',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_BEARER}`,
        },
        body: {
          email: 'not-an-email',
          firstName: 'Bad',
          lastName: 'Email',
          type: 'domestic',
        },
      })
      .willRespondWith({
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: like('Request validation failed'),
            details: like({ email: ['Invalid email address'] }),
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/api/v1/contractors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_BEARER}`,
        },
        body: JSON.stringify({
          email: 'not-an-email',
          firstName: 'Bad',
          lastName: 'Email',
          type: 'domestic',
        }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
