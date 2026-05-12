import { describe, it, expect } from 'vitest';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import {
  CONSUMER,
  PROVIDER,
  PACT_DIR,
  ADMIN_BEARER,
  CONTRACTOR_ID,
} from './constants';

const { string, like } = MatchersV3;

const provider = new PactV3({
  consumer: CONSUMER,
  provider: PROVIDER,
  dir: PACT_DIR,
});

describe('Pact: POST /api/v1/contractors/:contractorId/engagements', () => {
  it('201 + new engagement for an active contractor with a valid hourly engagement', async () => {
    provider
      .given(
        `an active contractor ${CONTRACTOR_ID} exists in org A as the only contractor`,
      )
      .uponReceiving('an admin creating an hourly engagement against the active contractor')
      .withRequest({
        method: 'POST',
        path: `/api/v1/contractors/${CONTRACTOR_ID}/engagements`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_BEARER}`,
        },
        body: {
          title: 'Q3 Backend Engagement',
          startDate: '2026-07-01',
          hourlyRate: 125,
        },
      })
      .willRespondWith({
        status: 201,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          data: like({
            id: string('22222222-2222-2222-2222-222222222222'),
            status: 'draft',
          }),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(
        `${mockServer.url}/api/v1/contractors/${CONTRACTOR_ID}/engagements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ADMIN_BEARER}`,
          },
          body: JSON.stringify({
            title: 'Q3 Backend Engagement',
            startDate: '2026-07-01',
            hourlyRate: 125,
          }),
        },
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as { data: { id: string; status: string } };
      expect(body.data.status).toBe('draft');
    });
  });
});
