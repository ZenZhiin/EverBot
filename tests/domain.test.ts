import { describe, it, expect } from 'vitest';
import {
  RobotType,
  ROBOT_SPECS,
  getCostPerHour,
  parseRobotType,
} from '../src/domain/types.js';
import { Inventory } from '../src/domain/inventory.js';
import {
  InvalidInputError,
  ZeroRobotsError,
  ImpossibleAllocationError,
  InsufficientCapacityError,
} from '../src/domain/exceptions.js';

describe('Domain Models & Specs', () => {
  it('should have exact specifications for each robot type', () => {
    expect(ROBOT_SPECS[RobotType.BRAVO]).toEqual({ workingHours: 3, chargingCost: 2 });
    expect(ROBOT_SPECS[RobotType.CHARLIE]).toEqual({ workingHours: 5, chargingCost: 3 });
    expect(ROBOT_SPECS[RobotType.DELTA]).toEqual({ workingHours: 8, chargingCost: 4 });
  });

  it('should compute correct cost per hour efficiency ranking', () => {
    const bravoRate = getCostPerHour(RobotType.BRAVO);
    const charlieRate = getCostPerHour(RobotType.CHARLIE);
    const deltaRate = getCostPerHour(RobotType.DELTA);

    expect(deltaRate).toBeCloseTo(4 / 8);
    expect(charlieRate).toBeCloseTo(3 / 5);
    expect(bravoRate).toBeCloseTo(2 / 3);

    // Delta is most cost efficient per hour, then Charlie, then Bravo
    expect(deltaRate).toBeLessThan(charlieRate);
    expect(charlieRate).toBeLessThan(bravoRate);
  });

  it('should parse robot type identifiers case-insensitively', () => {
    expect(parseRobotType('bravo')).toBe(RobotType.BRAVO);
    expect(parseRobotType('CHARLIE')).toBe(RobotType.CHARLIE);
    expect(parseRobotType('Delta')).toBe(RobotType.DELTA);
    expect(() => parseRobotType('unknown')).toThrow();
  });
});

describe('Inventory', () => {
  it('should calculate total counts and working capacity correctly', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 3,
      [RobotType.DELTA]: 2,
    });

    expect(inventory.get(RobotType.BRAVO)).toBe(2);
    expect(inventory.get(RobotType.CHARLIE)).toBe(3);
    expect(inventory.get(RobotType.DELTA)).toBe(2);
    expect(inventory.totalCount()).toBe(7);
    // 2*3 + 3*5 + 2*8 = 6 + 15 + 16 = 37 hours
    expect(inventory.totalCapacity()).toBe(37);
  });

  it('should throw InvalidInputError if robot count is negative or non-integer', () => {
    expect(() => new Inventory({ [RobotType.BRAVO]: -1 })).toThrow(InvalidInputError);
    expect(() => new Inventory({ [RobotType.CHARLIE]: 2.5 })).toThrow(InvalidInputError);
  });

  it('should consume and restore allocated units accurately', () => {
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 2,
      [RobotType.DELTA]: 2,
    });

    const allocation = {
      [RobotType.BRAVO]: 1,
      [RobotType.DELTA]: 1,
    };

    inventory.consume(allocation);
    expect(inventory.get(RobotType.BRAVO)).toBe(1);
    expect(inventory.get(RobotType.CHARLIE)).toBe(2);
    expect(inventory.get(RobotType.DELTA)).toBe(1);

    inventory.restore(allocation);
    expect(inventory.get(RobotType.BRAVO)).toBe(2);
    expect(inventory.get(RobotType.DELTA)).toBe(2);
  });

  it('should throw InsufficientCapacityError when consuming beyond available stock', () => {
    const inventory = new Inventory({ [RobotType.BRAVO]: 1 });
    expect(() => inventory.consume({ [RobotType.BRAVO]: 2 })).toThrow(
      InsufficientCapacityError,
    );
  });

  it('should produce an isolated deep clone of inventory', () => {
    const original = new Inventory({ [RobotType.BRAVO]: 3, [RobotType.CHARLIE]: 1 });
    const copy = original.clone();

    copy.consume({ [RobotType.BRAVO]: 1 });
    expect(original.get(RobotType.BRAVO)).toBe(3);
    expect(copy.get(RobotType.BRAVO)).toBe(2);
  });
});

describe('Domain Exceptions', () => {
  it('should have exact company-specified error messages', () => {
    expect(new ZeroRobotsError().message).toBe('Error: No robots available for assignment.');
    expect(new ImpossibleAllocationError().message).toBe(
      'Error: Unable to allocate at least one robot from each category with the available inventory.',
    );
    expect(new InsufficientCapacityError().message).toBe(
      'Error: Insufficient robot capacity to complete the requested work.',
    );
    expect(new InvalidInputError().message).toBe(
      'Error: Work hours must be a positive integer.',
    );
  });
});
