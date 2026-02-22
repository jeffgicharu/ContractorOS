import { scoreIrsTest } from './irs-test.scorer';
import type { ClassificationInputData } from '@contractor-os/shared';

describe('scoreIrsTest', () => {
  describe('empty input', () => {
    it('should return 0 for all-undefined input', () => {
      const result = scoreIrsTest({});
      expect(result.score).toBe(0);
      expect(result.factors.behavioral_control.score).toBe(0);
      expect(result.factors.financial_control.score).toBe(0);
      expect(result.factors.relationship_type.score).toBe(0);
    });
  });

  describe('maximum employee-like input', () => {
    it('should return high score for all employee indicators', () => {
      const input: ClassificationInputData = {
        hoursPerWeek: 45,
        engagementDurationWeeks: 60,
        setSchedule: true,
        toolsProvided: true,
        trainingProvided: true,
        supervisionLevel: 'high',
        integrationLevel: 'high',
        multipleClients: false,
        profitLossOpportunity: false,
        significantInvestment: false,
      };
      const result = scoreIrsTest(input);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.factors.behavioral_control.score).toBe(40);
      expect(result.factors.financial_control.score).toBe(30);
    });
  });

  describe('maximum contractor-like input', () => {
    it('should return low score for all contractor indicators', () => {
      const input: ClassificationInputData = {
        hoursPerWeek: 20,
        engagementDurationWeeks: 8,
        setSchedule: false,
        toolsProvided: false,
        trainingProvided: false,
        supervisionLevel: 'low',
        integrationLevel: 'low',
        multipleClients: true,
        profitLossOpportunity: true,
        significantInvestment: true,
      };
      const result = scoreIrsTest(input);
      expect(result.score).toBeLessThanOrEqual(10);
    });
  });

  describe('behavioral_control group', () => {
    it('should score instructions_given when training is provided', () => {
      const result = scoreIrsTest({ trainingProvided: true });
      expect(result.factors.behavioral_control.factors.instructions_given.score).toBe(10);
      expect(result.factors.behavioral_control.factors.instructions_given.value).toBe(true);
    });

    it('should score instructions_given when supervision is high', () => {
      const result = scoreIrsTest({ supervisionLevel: 'high' });
      expect(result.factors.behavioral_control.factors.instructions_given.score).toBe(10);
    });

    it('should not score instructions_given for low supervision without training', () => {
      const result = scoreIrsTest({ supervisionLevel: 'low', trainingProvided: false });
      expect(result.factors.behavioral_control.factors.instructions_given.score).toBe(0);
    });

    it('should score training_provided when true', () => {
      const result = scoreIrsTest({ trainingProvided: true });
      expect(result.factors.behavioral_control.factors.training_provided.score).toBe(10);
    });

    it('should not score training_provided when false', () => {
      const result = scoreIrsTest({ trainingProvided: false });
      expect(result.factors.behavioral_control.factors.training_provided.score).toBe(0);
    });

    it('should score set_work_hours when hoursPerWeek > 35', () => {
      const result = scoreIrsTest({ hoursPerWeek: 36 });
      expect(result.factors.behavioral_control.factors.set_work_hours.score).toBe(10);
      expect(result.factors.behavioral_control.factors.set_work_hours.value).toBe(true);
    });

    it('should not score set_work_hours when hoursPerWeek = 35', () => {
      const result = scoreIrsTest({ hoursPerWeek: 35 });
      expect(result.factors.behavioral_control.factors.set_work_hours.score).toBe(0);
    });

    it('should score set_work_hours when setSchedule is true', () => {
      const result = scoreIrsTest({ setSchedule: true, hoursPerWeek: 20 });
      expect(result.factors.behavioral_control.factors.set_work_hours.score).toBe(10);
    });

    it('should score tools_provided when true', () => {
      const result = scoreIrsTest({ toolsProvided: true });
      expect(result.factors.behavioral_control.factors.tools_provided.score).toBe(10);
    });

    it('should not score tools_provided when false', () => {
      const result = scoreIrsTest({ toolsProvided: false });
      expect(result.factors.behavioral_control.factors.tools_provided.score).toBe(0);
    });

    it('should have max score of 40 for behavioral_control', () => {
      expect(scoreIrsTest({}).factors.behavioral_control.max).toBe(40);
    });
  });

  describe('financial_control group', () => {
    it('should score significant_investment when false (no investment = employee-like)', () => {
      const result = scoreIrsTest({ significantInvestment: false });
      expect(result.factors.financial_control.factors.significant_investment.score).toBe(10);
    });

    it('should not score significant_investment when true', () => {
      const result = scoreIrsTest({ significantInvestment: true });
      expect(result.factors.financial_control.factors.significant_investment.score).toBe(0);
    });

    it('should score opportunity_profit_loss when false', () => {
      const result = scoreIrsTest({ profitLossOpportunity: false });
      expect(result.factors.financial_control.factors.opportunity_profit_loss.score).toBe(10);
    });

    it('should not score opportunity_profit_loss when true', () => {
      const result = scoreIrsTest({ profitLossOpportunity: true });
      expect(result.factors.financial_control.factors.opportunity_profit_loss.score).toBe(0);
    });

    it('should score unreimbursed_expenses when tools provided', () => {
      const result = scoreIrsTest({ toolsProvided: true });
      expect(result.factors.financial_control.factors.unreimbursed_expenses.score).toBe(10);
    });

    it('should have max score of 30 for financial_control', () => {
      expect(scoreIrsTest({}).factors.financial_control.max).toBe(30);
    });
  });

  describe('relationship_type group', () => {
    it('should score permanency as 10 for durationWeeks > 52', () => {
      const result = scoreIrsTest({ engagementDurationWeeks: 53 });
      expect(result.factors.relationship_type.factors.permanency.score).toBe(10);
      expect(result.factors.relationship_type.factors.permanency.value).toBe('ongoing');
    });

    it('should score permanency as 7 for durationWeeks 27-52', () => {
      const result = scoreIrsTest({ engagementDurationWeeks: 30 });
      expect(result.factors.relationship_type.factors.permanency.score).toBe(7);
      expect(result.factors.relationship_type.factors.permanency.value).toBe('long_term');
    });

    it('should score permanency as 4 for durationWeeks 13-26', () => {
      const result = scoreIrsTest({ engagementDurationWeeks: 15 });
      expect(result.factors.relationship_type.factors.permanency.score).toBe(4);
      expect(result.factors.relationship_type.factors.permanency.value).toBe('medium_term');
    });

    it('should score permanency as 0 for durationWeeks <= 12', () => {
      const result = scoreIrsTest({ engagementDurationWeeks: 12 });
      expect(result.factors.relationship_type.factors.permanency.score).toBe(0);
      expect(result.factors.relationship_type.factors.permanency.value).toBe('short_term');
    });

    it('should score benefits_provided when integration is high', () => {
      const result = scoreIrsTest({ integrationLevel: 'high' });
      expect(result.factors.relationship_type.factors.benefits_provided.score).toBe(10);
    });

    it('should score written_contract_type as employee when integration is high', () => {
      const result = scoreIrsTest({ integrationLevel: 'high' });
      expect(result.factors.relationship_type.factors.written_contract_type.score).toBe(10);
      expect(result.factors.relationship_type.factors.written_contract_type.value).toBe('employee');
    });

    it('should have max score of 30 for relationship_type', () => {
      expect(scoreIrsTest({}).factors.relationship_type.max).toBe(30);
    });
  });

  describe('total score', () => {
    it('should sum all group scores', () => {
      const result = scoreIrsTest({ trainingProvided: true, significantInvestment: false });
      const expected =
        result.factors.behavioral_control.score +
        result.factors.financial_control.score +
        result.factors.relationship_type.score;
      expect(result.score).toBe(expected);
    });
  });
});
