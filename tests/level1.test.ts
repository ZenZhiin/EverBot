import { describe, it, expect } from 'vitest';
import { RobotType } from '../src/domain/types.js';
import { Inventory } from '../src/domain/inventory.js';
import {
  InvalidInputError,
  ZeroRobotsError,
  ImpossibleAllocationError,
  InsufficientCapacityError,
} from '../src/domain/exceptions.js';
import { CategoryDistributionStrategy } from '../src/strategies/category_distribution.js';

describe('Level 1: Category Distribution Strategy', () => {
  const strategy = new CategoryDistributionStrategy();

  it('satisfies Slide 7: 16 hours requested (exact 1 of each category)', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 3,
      [RobotType.DELTA]: 2,
    });

    const result = strategy.allocate(inventory, 16);

    expect(result.isSuccessful).toBe(true);
    expect(result.assignments[RobotType.BRAVO]).toBe(1);
    expect(result.assignments[RobotType.CHARLIE]).toBe(1);
    expect(result.assignments[RobotType.DELTA]).toBe(1);
    expect(result.totalHoursProvided).toBe(16);
    expect(result.excessHours).toBe(0);
    expect(result.totalCost).toBe(9); // 2 + 3 + 4
  });

  it('satisfies Slide 6: 17 hours requested -> picks Bravo (extra)', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 3,
      [RobotType.DELTA]: 2,
    });

    const result = strategy.allocate(inventory, 17);

    expect(result.isSuccessful).toBe(true);
    // Base 16 + Bravo(3) = 19 (excess 2) vs +Charlie(5) = 21 (excess 4)
    expect(result.assignments[RobotType.BRAVO]).toBe(2);
    expect(result.assignments[RobotType.CHARLIE]).toBe(1);
    expect(result.assignments[RobotType.DELTA]).toBe(1);
    expect(result.totalHoursProvided).toBe(19);
    expect(result.excessHours).toBe(2);
  });

  it('satisfies Slide 6: 21 hours requested -> picks Charlie (extra)', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 3,
      [RobotType.DELTA]: 2,
    });

    const result = strategy.allocate(inventory, 21);

    expect(result.isSuccessful).toBe(true);
    // Base 16 + Charlie(5) = 21 (excess 0)
    expect(result.assignments[RobotType.BRAVO]).toBe(1);
    expect(result.assignments[RobotType.CHARLIE]).toBe(2);
    expect(result.assignments[RobotType.DELTA]).toBe(1);
    expect(result.totalHoursProvided).toBe(21);
    expect(result.excessHours).toBe(0);
  });

  it('satisfies Slide 6: 24 hours requested -> picks Delta (extra)', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 3,
      [RobotType.DELTA]: 2,
    });

    const result = strategy.allocate(inventory, 24);

    expect(result.isSuccessful).toBe(true);
    // Base 16 + Delta(8) = 24 (excess 0)
    expect(result.assignments[RobotType.BRAVO]).toBe(1);
    expect(result.assignments[RobotType.CHARLIE]).toBe(1);
    expect(result.assignments[RobotType.DELTA]).toBe(2);
    expect(result.totalHoursProvided).toBe(24);
    expect(result.excessHours).toBe(0);
  });

  it('satisfies Slide 10: 20 hours requested costs $12 in Level 1', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 3,
      [RobotType.DELTA]: 2,
    });

    const result = strategy.allocate(inventory, 20);

    expect(result.isSuccessful).toBe(true);
    // Bravo: 1 (3h), Charlie: 2 (10h), Delta: 1 (8h) = 21h (excess 1)
    // Cost: 2 + 6 + 4 = $12
    expect(result.assignments[RobotType.BRAVO]).toBe(1);
    expect(result.assignments[RobotType.CHARLIE]).toBe(2);
    expect(result.assignments[RobotType.DELTA]).toBe(1);
    expect(result.totalHoursProvided).toBe(21);
    expect(result.totalCost).toBe(12);
  });

  it('throws ZeroRobotsError when total inventory is 0', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 0,
      [RobotType.CHARLIE]: 0,
      [RobotType.DELTA]: 0,
    });

    expect(() => strategy.allocate(inventory, 16)).toThrow(ZeroRobotsError);
  });

  it('throws ImpossibleAllocationError when at least one robot category is unavailable', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 0, // missing Charlie
      [RobotType.DELTA]: 2,
    });

    expect(() => strategy.allocate(inventory, 16)).toThrow(ImpossibleAllocationError);
  });

  it('throws InsufficientCapacityError when inventory capacity is less than requested hours', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 1,
      [RobotType.CHARLIE]: 1,
      [RobotType.DELTA]: 1,
    }); // Total capacity = 16

    expect(() => strategy.allocate(inventory, 25)).toThrow(InsufficientCapacityError);
  });

  it('throws InvalidInputError when hours requested is zero or negative', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 1,
      [RobotType.CHARLIE]: 1,
      [RobotType.DELTA]: 1,
    });

    expect(() => strategy.allocate(inventory, 0)).toThrow(InvalidInputError);
    expect(() => strategy.allocate(inventory, -10)).toThrow(InvalidInputError);
  });
});
