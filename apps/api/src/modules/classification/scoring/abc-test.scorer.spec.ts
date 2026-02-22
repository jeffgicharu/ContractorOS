import { scoreAbcTest } from './abc-test.scorer';
import type { ClassificationInputData } from '@contractor-os/shared';

describe('scoreAbcTest', () => {
  describe('empty input (all undefined)', () => {
    it('should fail all prongs (employee-like) — score 100', () => {
      const result = scoreAbcTest({});
      expect(result.score).toBe(100);
      expect(result.factors.prong_a.passed).toBe(false);
      expect(result.factors.prong_b.passed).toBe(false);
      expect(result.factors.prong_c.passed).toBe(false);
    });
  });

  describe('all prongs passed (contractor)', () => {
    it('should score 0 when all prongs pass', () => {
      const input: ClassificationInputData = {
        setSchedule: false,
        toolsProvided: false,
        supervisionLevel: 'low',
        integrationLevel: 'low',
        multipleClients: true,
        significantInvestment: true,
      };
      const result = scoreAbcTest(input);
      expect(result.score).toBe(0);
      expect(result.factors.prong_a.passed).toBe(true);
      expect(result.factors.prong_b.passed).toBe(true);
      expect(result.factors.prong_c.passed).toBe(true);
    });
  });

  describe('prong A: Free from Control', () => {
    it('should pass when setSchedule=false, toolsProvided=false, supervision!=high', () => {
      const result = scoreAbcTest({
        setSchedule: false,
        toolsProvided: false,
        supervisionLevel: 'low',
      });
      expect(result.factors.prong_a.passed).toBe(true);
      expect(result.factors.prong_a.score).toBe(0);
    });

    it('should fail when setSchedule=true', () => {
      const result = scoreAbcTest({
        setSchedule: true,
        toolsProvided: false,
        supervisionLevel: 'low',
      });
      expect(result.factors.prong_a.passed).toBe(false);
      expect(result.factors.prong_a.score).toBe(34);
    });

    it('should fail when toolsProvided=true', () => {
      const result = scoreAbcTest({
        setSchedule: false,
        toolsProvided: true,
        supervisionLevel: 'low',
      });
      expect(result.factors.prong_a.passed).toBe(false);
      expect(result.factors.prong_a.score).toBe(34);
    });

    it('should fail when supervision is high', () => {
      const result = scoreAbcTest({
        setSchedule: false,
        toolsProvided: false,
        supervisionLevel: 'high',
      });
      expect(result.factors.prong_a.passed).toBe(false);
      expect(result.factors.prong_a.score).toBe(34);
    });

    it('should fail when setSchedule is undefined (burden of proof)', () => {
      const result = scoreAbcTest({
        toolsProvided: false,
        supervisionLevel: 'low',
      });
      expect(result.factors.prong_a.passed).toBe(false);
    });

    it('should include notes about control indicators when failing', () => {
      const result = scoreAbcTest({ setSchedule: true, toolsProvided: true });
      expect(result.factors.prong_a.notes).toContain('set schedule');
      expect(result.factors.prong_a.notes).toContain('tools provided');
    });
  });

  describe('prong B: Outside Usual Course', () => {
    it('should pass when integrationLevel is low', () => {
      const result = scoreAbcTest({ integrationLevel: 'low' });
      expect(result.factors.prong_b.passed).toBe(true);
      expect(result.factors.prong_b.score).toBe(0);
    });

    it('should fail when integrationLevel is medium', () => {
      const result = scoreAbcTest({ integrationLevel: 'medium' });
      expect(result.factors.prong_b.passed).toBe(false);
      expect(result.factors.prong_b.score).toBe(33);
    });

    it('should fail when integrationLevel is high', () => {
      const result = scoreAbcTest({ integrationLevel: 'high' });
      expect(result.factors.prong_b.passed).toBe(false);
      expect(result.factors.prong_b.score).toBe(33);
    });

    it('should fail when integrationLevel is undefined', () => {
      const result = scoreAbcTest({});
      expect(result.factors.prong_b.passed).toBe(false);
    });
  });

  describe('prong C: Independently Established', () => {
    it('should pass when multipleClients=true AND significantInvestment=true', () => {
      const result = scoreAbcTest({
        multipleClients: true,
        significantInvestment: true,
      });
      expect(result.factors.prong_c.passed).toBe(true);
      expect(result.factors.prong_c.score).toBe(0);
    });

    it('should fail when multipleClients=false', () => {
      const result = scoreAbcTest({
        multipleClients: false,
        significantInvestment: true,
      });
      expect(result.factors.prong_c.passed).toBe(false);
      expect(result.factors.prong_c.score).toBe(33);
    });

    it('should fail when significantInvestment=false', () => {
      const result = scoreAbcTest({
        multipleClients: true,
        significantInvestment: false,
      });
      expect(result.factors.prong_c.passed).toBe(false);
      expect(result.factors.prong_c.score).toBe(33);
    });

    it('should fail when both are undefined', () => {
      const result = scoreAbcTest({});
      expect(result.factors.prong_c.passed).toBe(false);
    });

    it('should include notes about missing evidence when failing', () => {
      const result = scoreAbcTest({ multipleClients: false });
      expect(result.factors.prong_c.notes).toContain('no evidence of multiple clients');
    });
  });

  describe('weight distribution', () => {
    it('should have weights 34 + 33 + 33 = 100', () => {
      const result = scoreAbcTest({});
      const totalWeight =
        result.factors.prong_a.weight +
        result.factors.prong_b.weight +
        result.factors.prong_c.weight;
      expect(totalWeight).toBe(100);
    });
  });

  describe('total score', () => {
    it('should sum all prong scores', () => {
      const result = scoreAbcTest({ integrationLevel: 'low', multipleClients: true, significantInvestment: true });
      const sum =
        result.factors.prong_a.score +
        result.factors.prong_b.score +
        result.factors.prong_c.score;
      expect(result.score).toBe(sum);
    });
  });
});
