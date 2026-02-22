import { aggregateRiskScore, scoreToRiskLevel } from './risk-aggregator';

describe('aggregateRiskScore', () => {
  it('should weight IRS 40%, DOL 30%, ABC 30%', () => {
    const result = aggregateRiskScore(100, 0, 0);
    expect(result.overallScore).toBe(40);
  });

  it('should weight DOL 30%', () => {
    const result = aggregateRiskScore(0, 100, 0);
    expect(result.overallScore).toBe(30);
  });

  it('should weight ABC 30%', () => {
    const result = aggregateRiskScore(0, 0, 100);
    expect(result.overallScore).toBe(30);
  });

  it('should combine all three tests', () => {
    const result = aggregateRiskScore(50, 50, 50);
    expect(result.overallScore).toBe(50);
  });

  it('should handle all zeros', () => {
    const result = aggregateRiskScore(0, 0, 0);
    expect(result.overallScore).toBe(0);
    expect(result.overallRisk).toBe('low');
  });

  it('should handle all 100s', () => {
    const result = aggregateRiskScore(100, 100, 100);
    expect(result.overallScore).toBe(100);
    expect(result.overallRisk).toBe('critical');
  });

  it('should round to 2 decimal places', () => {
    const result = aggregateRiskScore(33, 33, 33);
    // 33 * 0.4 + 33 * 0.3 + 33 * 0.3 = 13.2 + 9.9 + 9.9 = 33
    expect(result.overallScore).toBe(33);
  });

  it('should assign correct risk levels', () => {
    expect(aggregateRiskScore(0, 0, 0).overallRisk).toBe('low');
    expect(aggregateRiskScore(60, 60, 60).overallRisk).toBe('high');
    expect(aggregateRiskScore(80, 80, 80).overallRisk).toBe('critical');
  });

  it('should handle non-integer inputs', () => {
    const result = aggregateRiskScore(33.5, 66.7, 12.3);
    expect(typeof result.overallScore).toBe('number');
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

describe('scoreToRiskLevel', () => {
  it('should return low for 0', () => {
    expect(scoreToRiskLevel(0)).toBe('low');
  });

  it('should return low for 24', () => {
    expect(scoreToRiskLevel(24)).toBe('low');
  });

  it('should return medium for 25', () => {
    expect(scoreToRiskLevel(25)).toBe('medium');
  });

  it('should return medium for 49', () => {
    expect(scoreToRiskLevel(49)).toBe('medium');
  });

  it('should return high for 50', () => {
    expect(scoreToRiskLevel(50)).toBe('high');
  });

  it('should return high for 74', () => {
    expect(scoreToRiskLevel(74)).toBe('high');
  });

  it('should return critical for 75', () => {
    expect(scoreToRiskLevel(75)).toBe('critical');
  });

  it('should return critical for 100', () => {
    expect(scoreToRiskLevel(100)).toBe('critical');
  });

  it('should return critical for score > 100 (edge case)', () => {
    expect(scoreToRiskLevel(105)).toBe('critical');
  });

  it('should return low for negative score (edge case)', () => {
    expect(scoreToRiskLevel(-5)).toBe('low');
  });
});
