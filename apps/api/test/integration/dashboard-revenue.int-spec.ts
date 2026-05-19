import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { DashboardRepository } from '../../src/modules/organizations/dashboard.repository';
import { demoSeed } from '../../src/database/seeds/seed';
import { SEED_ORG_ID } from '../../src/database/seeds/fixtures/organizations';

// Documented Monthly Revenue band — kept in lockstep with the baseline
// comment block in src/database/seeds/seed.ts.
const REVENUE_FLOOR = 40_000;
const REVENUE_CEILING = 200_000;
const DISPLAYED_MONTHS = 6;

describe('Integration: dashboard Monthly Revenue is healthy on every reseed', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
    // The demo seed clears every table itself, but reset first so a prior
    // suite's data can never bleed into the aggregation under test.
    await resetDatabase(ctx.pool);
    await demoSeed();
  }, 180_000);

  afterAll(async () => {
    await ctx.close();
  });

  it('every month in the displayed window has revenue inside the documented band', async () => {
    const repo = ctx.app.get(DashboardRepository);
    const rows = await repo.getMonthlyRevenue(SEED_ORG_ID, DISPLAYED_MONTHS);

    expect(rows).toHaveLength(DISPLAYED_MONTHS);

    for (const row of rows) {
      // No zero-start / mid-window gap on any reseed.
      expect(row.total).toBeGreaterThan(0);
      // Floor: chart always reads as an established business.
      expect(row.total).toBeGreaterThanOrEqual(REVENUE_FLOOR);
      // Ceiling: no single month spikes off the top of the axis.
      expect(row.total).toBeLessThanOrEqual(REVENUE_CEILING);
    }
  });
});
