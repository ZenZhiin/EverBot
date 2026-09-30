import { describe, it, expect } from 'vitest';
import { RobotType } from '../src/domain/types.js';
import { Inventory } from '../src/domain/inventory.js';
import { InvalidInputError } from '../src/domain/exceptions.js';
import { MultiClientAllocator } from '../src/services/multi_client_allocator.js';
import { CostOptimizedStrategy } from '../src/strategies/cost_optimized.js';

describe('Level 4: Multi-Client Allocation Engine', () => {
  const allocator = new MultiClientAllocator(new CostOptimizedStrategy());

  it('parses comma-separated and space-separated input strings into client requests', () => {
    const clients1 = allocator.parseClientInputs('12,16,17,10,21');
    expect(clients1.map((c) => c.hoursRequested)).toEqual([12, 16, 17, 10, 21]);

    const clients2 = allocator.parseClientInputs('12 16 17 10 21');
    expect(clients2.map((c) => c.hoursRequested)).toEqual([12, 16, 17, 10, 21]);

    const clients3 = allocator.parseClientInputs('20');
    expect(clients3.map((c) => c.hoursRequested)).toEqual([20]);
  });

  it('throws InvalidInputError on invalid or negative client input numbers', () => {
    expect(() => allocator.parseClientInputs('12, -5, 20')).toThrow(InvalidInputError);
    expect(() => allocator.parseClientInputs('abc, 20')).toThrow(InvalidInputError);
    expect(() => allocator.parseClientInputs('')).toThrow(InvalidInputError);
  });

  it('prioritises clients based on highest hours requested first (Slide 14)', () => {
    // Inventory: Bravo: 2 (6h), Charlie: 2 (10h), Delta: 3 (24h) -> Total 40h
    const inventory = new Inventory({
      [RobotType.BRAVO]: 2,
      [RobotType.CHARLIE]: 2,
      [RobotType.DELTA]: 3,
    });

    const requests = allocator.parseClientInputs('10, 21, 16');
    const batchResult = allocator.allocateBatch(requests, inventory);

    // Order of execution should be 21 first, then 16, then 10
    const executedHours = batchResult.clientResults.map((r) => r.hoursRequested);
    expect(executedHours).toEqual([21, 16, 10]);

    // Client 21h gets Charlie: 1 (5h) + Delta: 2 (16h) = 21h (from active)
    // Remaining active: Bravo: 2, Charlie: 1, Delta: 1 (Total: 6 + 5 + 8 = 19h)
    // Client 16h: needs 16h. Remaining active has Delta: 1 (8h), Charlie: 1 (5h), Bravo: 2 (6h)
    // Can active supply 16h? Delta: 1 (8h) + Charlie: 1 (5h) + Bravo: 1 (3h) = 16h!
    // Remaining active: Bravo: 1 (3h).
    // Client 10h: Active only has 3h, so standby is triggered!
    expect(batchResult.clientResults[0].standbyRequired).toBe(false);
    expect(batchResult.clientResults[1].standbyRequired).toBe(false);
    expect(batchResult.clientResults[2].standbyRequired).toBe(true);
  });

  it('ensures each physical robot is used at most once per allocation run', () => {
    // Inventory: 1 Delta (8h)
    const inventory = new Inventory({
      [RobotType.DELTA]: 1,
    });

    const requests = allocator.parseClientInputs('8, 8');
    const batchResult = allocator.allocateBatch(requests, inventory);

    // First client gets the only Delta
    expect(batchResult.clientResults[0].activeAssignments[RobotType.DELTA]).toBe(1);
    expect(batchResult.clientResults[0].standbyRequired).toBe(false);

    // Second client has no active Delta remaining, triggers standby
    expect(batchResult.clientResults[1].activeAssignments[RobotType.DELTA]).toBe(0);
    expect(batchResult.clientResults[1].standbyRequired).toBe(true);
    // Standby will provision Delta: 1 for $4
    expect(batchResult.clientResults[1].standbyAssignments[RobotType.DELTA]).toBe(1);
  });
});
