import { describe, it, expect } from 'vitest';
import { RobotType } from '../src/domain/types.js';
import { Inventory } from '../src/domain/inventory.js';
import { CostOptimizedStrategy } from '../src/strategies/cost_optimized.js';
import { CategoryDistributionStrategy } from '../src/strategies/category_distribution.js';
import { FinancialComparisonService } from '../src/services/financial_comparison.js';

describe('Level 2: Cost-Optimized Strategy', () => {
  const strategy = new CostOptimizedStrategy();

  it('satisfies Slide 9 Example 1: 20 hours requested -> Charlie: 1, Delta: 2 for $11', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 3,
      [RobotType.DELTA]: 2,
    });

    const result = strategy.allocate(inventory, 20);

    expect(result.isSuccessful).toBe(true);
    expect(result.assignments[RobotType.BRAVO]).toBe(0);
    expect(result.assignments[RobotType.CHARLIE]).toBe(1);
    expect(result.assignments[RobotType.DELTA]).toBe(2);
    // 1*5 + 2*8 = 21 hours
    expect(result.totalHoursProvided).toBe(21);
    expect(result.excessHours).toBe(1);
    // 1*$3 + 2*$4 = $11
    expect(result.totalCost).toBe(11);
  });

  it('satisfies Slide 9 Example 2: 6 hours requested -> Bravo: 2 for $4 (tie-breaker over Delta: 1)', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 2,
      [RobotType.DELTA]: 3,
    });

    const result = strategy.allocate(inventory, 6);

    expect(result.isSuccessful).toBe(true);
    // Both 2 Bravo ($4, 6h) and 1 Delta ($4, 8h) cost $4.
    // Bravo: 2 is selected because excess hours is 0 (vs 2 for Delta: 1).
    expect(result.assignments[RobotType.BRAVO]).toBe(2);
    expect(result.assignments[RobotType.CHARLIE]).toBe(0);
    expect(result.assignments[RobotType.DELTA]).toBe(0);
    expect(result.totalHoursProvided).toBe(6);
    expect(result.excessHours).toBe(0);
    expect(result.totalCost).toBe(4);
  });

  it('allows single robot category usage if optimal', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 5,
      [RobotType.CHARLIE]: 0,
      [RobotType.DELTA]: 0,
    });

    const result = strategy.allocate(inventory, 9);
    expect(result.isSuccessful).toBe(true);
    expect(result.assignments[RobotType.BRAVO]).toBe(3); // 3*3 = 9 hours
    expect(result.totalCost).toBe(6);
  });
});

describe('Level 1 vs Level 2 Financial Comparison', () => {
  const comparisonService = new FinancialComparisonService();
  const l1Strategy = new CategoryDistributionStrategy();
  const l2Strategy = new CostOptimizedStrategy();

  it('satisfies Slide 10: Example 1 comparison shows $1 difference with exact insight text', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 3,
      [RobotType.DELTA]: 2,
    });

    const l1Result = l1Strategy.allocate(inventory, 20);
    const l2Result = l2Strategy.allocate(inventory, 20);

    const comparison = comparisonService.compare(l1Result, l2Result);

    expect(comparison.level1Cost).toBe(12);
    expect(comparison.level2Cost).toBe(11);
    expect(comparison.costDifference).toBe(1);
    expect(comparison.insight).toBe(
      'Level 1 strategy resulted in $1 additional cost due to mandatory usage of multiple robot categories.',
    );
  });

  it('handles scenario where Level 1 and Level 2 costs are equal', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 1,
      [RobotType.CHARLIE]: 1,
      [RobotType.DELTA]: 1,
    });

    const l1Result = l1Strategy.allocate(inventory, 16);
    const l2Result = l2Strategy.allocate(inventory, 16);

    const comparison = comparisonService.compare(l1Result, l2Result);
    expect(comparison.level1Cost).toBe(9);
    expect(comparison.level2Cost).toBe(9);
    expect(comparison.costDifference).toBe(0);
    expect(comparison.insight).toContain('both achieved the optimal cost of $9');
  });
});
