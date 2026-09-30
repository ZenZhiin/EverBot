import { describe, it, expect } from 'vitest';
import { RobotType } from '../src/domain/types.js';
import { Inventory } from '../src/domain/inventory.js';
import { StandbyOptimizer } from '../src/services/standby_optimizer.js';

describe('Level 3: Standby Robot Activation', () => {
  const standbyOptimizer = new StandbyOptimizer();

  it('satisfies Slide 12 Example 1: Active capacity 16h, requested 21h -> Charlie: 1 is optimal standby', () => {
    const activeInventory = new Inventory({
      [RobotType.BRAVO]: 1,
      [RobotType.CHARLIE]: 1,
      [RobotType.DELTA]: 1,
    }); // 3 + 5 + 8 = 16h

    const result = standbyOptimizer.evaluateStandbyRequirement(activeInventory, 21);

    expect(result.activeCapacity).toBe(16);
    expect(result.clientHoursRequested).toBe(21);
    expect(result.shortfallHours).toBe(5);

    // Verify all non-redundant feasible standby options are discovered
    const optionDescriptions = result.allOptions.map((opt) => {
      const parts = Object.entries(opt.assignments)
        .filter(([, qty]) => qty > 0)
        .map(([type, qty]) => `${type}: ${qty}`);
      return `${parts.join(', ')} - cost $${opt.totalCost}`;
    });

    expect(optionDescriptions).toContain('Bravo: 2 - cost $4');
    expect(optionDescriptions).toContain('Charlie: 1 - cost $3');
    expect(optionDescriptions).toContain('Delta: 1 - cost $4');

    // Charlie: 1 is the cost-optimal choice ($3 vs $4)
    expect(result.optimalOption.assignments[RobotType.CHARLIE]).toBe(1);
    expect(result.optimalOption.totalCost).toBe(3);
    expect(result.optimalOption.totalHoursProvided).toBe(5);
  });

  it('returns no shortfall when active capacity is already sufficient', () => {
    const activeInventory = new Inventory({
      [RobotType.DELTA]: 3, // 24 hours
    });

    const result = standbyOptimizer.evaluateStandbyRequirement(activeInventory, 20);

    expect(result.shortfallHours).toBe(0);
    expect(result.allOptions).toHaveLength(0);
    expect(result.optimalOption.totalCost).toBe(0);
  });

  it('handles larger shortfalls (e.g. 13 hours shortfall)', () => {
    const activeInventory = new Inventory({
      [RobotType.BRAVO]: 1, // 3 hours
    });

    const result = standbyOptimizer.evaluateStandbyRequirement(activeInventory, 16);
    expect(result.shortfallHours).toBe(13);

    // 2 Delta (16h, $8) vs 1 Delta + 1 Charlie (13h, $7)
    // 1 Delta (8h) + 1 Charlie (5h) = 13h, cost: 4 + 3 = $7
    expect(result.optimalOption.assignments[RobotType.CHARLIE]).toBe(1);
    expect(result.optimalOption.assignments[RobotType.DELTA]).toBe(1);
    expect(result.optimalOption.totalCost).toBe(7);
  });
});
