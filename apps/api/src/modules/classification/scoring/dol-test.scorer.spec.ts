import { scoreDolTest } from './dol-test.scorer';
import type { ClassificationInputData } from '@contractor-os/shared';

describe('scoreDolTest', () => {
  describe('empty input', () => {
    it('should return 0 for all-undefined input', () => {
      const result = scoreDolTest({});
      expect(result.score).toBe(0);
    });
  });

  describe('maximum employee-like input', () => {
    it('should return high score for full employee indicators', () => {
      const input: ClassificationInputData = {
        hoursPerWeek: 45,
        engagementDurationWeeks: 60,
        setSchedule: true,
        toolsProvided: true,
        supervisionLevel: 'high',
        integrationLevel: 'high',
        multipleClients: false,
        profitLossOpportunity: false,
        significantInvestment: false,
      };
      const result = scoreDolTest(input);
      expect(result.score).toBeGreaterThanOrEqual(85);
    });
  });

  describe('maximum contractor-like input', () => {
    it('should return low score for full contractor indicators', () => {
      const input: ClassificationInputData = {
        hoursPerWeek: 15,
        engagementDurationWeeks: 8,
        setSchedule: false,
        toolsProvided: false,
        supervisionLevel: 'low',
        integrationLevel: 'low',
        multipleClients: true,
        profitLossOpportunity: true,
        significantInvestment: true,
      };
      const result = scoreDolTest(input);
      expect(result.score).toBeLessThanOrEqual(10);
    });
  });

  describe('opportunity_profit_loss factor', () => {
    it('should score 17 when profitLossOpportunity is false', () => {
      const result = scoreDolTest({ profitLossOpportunity: false });
      expect(result.factors.opportunity_profit_loss.score).toBe(17);
    });

    it('should score 0 when profitLossOpportunity is true', () => {
      const result = scoreDolTest({ profitLossOpportunity: true });
      expect(result.factors.opportunity_profit_loss.score).toBe(0);
    });
  });

  describe('investment factor', () => {
    it('should score 17 when significantInvestment is false', () => {
      const result = scoreDolTest({ significantInvestment: false });
      expect(result.factors.investment.score).toBe(17);
    });

    it('should score 0 when significantInvestment is true', () => {
      const result = scoreDolTest({ significantInvestment: true });
      expect(result.factors.investment.score).toBe(0);
    });
  });

  describe('permanence factor', () => {
    it('should score 17 for durationWeeks > 52', () => {
      const result = scoreDolTest({ engagementDurationWeeks: 60 });
      expect(result.factors.permanence.score).toBe(17);
    });

    it('should score 12 for durationWeeks 27-52', () => {
      const result = scoreDolTest({ engagementDurationWeeks: 30 });
      expect(result.factors.permanence.score).toBe(12);
    });

    it('should score 6 for durationWeeks 13-26', () => {
      const result = scoreDolTest({ engagementDurationWeeks: 15 });
      expect(result.factors.permanence.score).toBe(6);
    });

    it('should score 0 for durationWeeks <= 12', () => {
      const result = scoreDolTest({ engagementDurationWeeks: 10 });
      expect(result.factors.permanence.score).toBe(0);
    });

    it('should score 0 when durationWeeks is undefined', () => {
      const result = scoreDolTest({});
      expect(result.factors.permanence.score).toBe(0);
    });
  });

  describe('employer_control factor (composite)', () => {
    it('should score 17 when all 3 control factors are true', () => {
      const result = scoreDolTest({
        setSchedule: true,
        toolsProvided: true,
        supervisionLevel: 'high',
      });
      expect(result.factors.employer_control.score).toBe(17);
    });

    it('should score ~11 when 2 of 3 control factors are true', () => {
      const result = scoreDolTest({
        setSchedule: true,
        toolsProvided: true,
        supervisionLevel: 'low',
      });
      expect(result.factors.employer_control.score).toBe(11);
    });

    it('should score ~6 when 1 of 3 control factors is true', () => {
      const result = scoreDolTest({
        setSchedule: true,
        toolsProvided: false,
        supervisionLevel: 'low',
      });
      expect(result.factors.employer_control.score).toBe(6);
    });

    it('should score 0 when no control factors are true', () => {
      const result = scoreDolTest({
        setSchedule: false,
        toolsProvided: false,
        supervisionLevel: 'low',
      });
      expect(result.factors.employer_control.score).toBe(0);
    });
  });

  describe('integral_to_business factor', () => {
    it('should score 16 for high integration', () => {
      const result = scoreDolTest({ integrationLevel: 'high' });
      expect(result.factors.integral_to_business.score).toBe(16);
    });

    it('should score 8 for medium integration', () => {
      const result = scoreDolTest({ integrationLevel: 'medium' });
      expect(result.factors.integral_to_business.score).toBe(8);
    });

    it('should score 0 for low integration', () => {
      const result = scoreDolTest({ integrationLevel: 'low' });
      expect(result.factors.integral_to_business.score).toBe(0);
    });
  });

  describe('skill_initiative factor (composite)', () => {
    it('should score 16 when both indicators are true', () => {
      const result = scoreDolTest({
        multipleClients: false,
        significantInvestment: false,
      });
      expect(result.factors.skill_initiative.score).toBe(16);
    });

    it('should score 8 when 1 indicator is true', () => {
      const result = scoreDolTest({
        multipleClients: false,
        significantInvestment: true,
      });
      expect(result.factors.skill_initiative.score).toBe(8);
    });

    it('should score 0 when no indicators are true', () => {
      const result = scoreDolTest({
        multipleClients: true,
        significantInvestment: true,
      });
      expect(result.factors.skill_initiative.score).toBe(0);
    });
  });

  describe('total score consistency', () => {
    it('should sum all factor scores', () => {
      const input: ClassificationInputData = {
        profitLossOpportunity: false,
        significantInvestment: false,
        engagementDurationWeeks: 30,
      };
      const result = scoreDolTest(input);
      const sum = Object.values(result.factors).reduce((acc, f) => acc + f.score, 0);
      expect(result.score).toBe(sum);
    });
  });
});
