/**
 * Fleet inventory state and capacity management.
 */

import { RobotType, ROBOT_SPECS, type AllocationMap } from './types.js';
import { InvalidInputError, InsufficientCapacityError } from './exceptions.js';

export class Inventory {
  private readonly counts: Map<RobotType, number>;

  constructor(initialCounts?: Partial<AllocationMap>) {
    this.counts = new Map<RobotType, number>([
      [RobotType.BRAVO, 0],
      [RobotType.CHARLIE, 0],
      [RobotType.DELTA, 0],
    ]);

    if (initialCounts) {
      for (const [typeKey, qty] of Object.entries(initialCounts)) {
        if (!Object.values(RobotType).includes(typeKey as RobotType)) {
          continue; // Ignore unknown keys
        }
        const robotType = typeKey as RobotType;
        if (qty !== undefined) {
          this.validateQuantity(qty);
          this.counts.set(robotType, qty);
        }
      }
    }
  }

  private validateQuantity(qty: number): void {
    if (!Number.isInteger(qty) || qty < 0) {
      throw new InvalidInputError('Error: Robot counts must be non-negative integers.');
    }
  }

  public get(type: RobotType): number {
    return this.counts.get(type) ?? 0;
  }

  public set(type: RobotType, count: number): void {
    this.validateQuantity(count);
    this.counts.set(type, count);
  }

  public totalCount(): number {
    let sum = 0;
    for (const count of this.counts.values()) {
      sum += count;
    }
    return sum;
  }

  public totalCapacity(): number {
    let capacity = 0;
    for (const [type, count] of this.counts.entries()) {
      capacity += count * ROBOT_SPECS[type].workingHours;
    }
    return capacity;
  }

  public hasAtLeast(allocation: Partial<AllocationMap>): boolean {
    for (const [typeKey, qty] of Object.entries(allocation)) {
      if (!Object.values(RobotType).includes(typeKey as RobotType)) continue;
      const robotType = typeKey as RobotType;
      const needed = qty ?? 0;
      if (this.get(robotType) < needed) {
        return false;
      }
    }
    return true;
  }

  public consume(allocation: Partial<AllocationMap>): void {
    if (!this.hasAtLeast(allocation)) {
      throw new InsufficientCapacityError();
    }
    for (const [typeKey, qty] of Object.entries(allocation)) {
      if (!Object.values(RobotType).includes(typeKey as RobotType)) continue;
      const robotType = typeKey as RobotType;
      const count = qty ?? 0;
      const current = this.get(robotType);
      this.counts.set(robotType, current - count);
    }
  }

  public restore(allocation: Partial<AllocationMap>): void {
    for (const [typeKey, qty] of Object.entries(allocation)) {
      if (!Object.values(RobotType).includes(typeKey as RobotType)) continue;
      const robotType = typeKey as RobotType;
      const count = qty ?? 0;
      const current = this.get(robotType);
      this.counts.set(robotType, current + count);
    }
  }

  public clone(): Inventory {
    return new Inventory({
      [RobotType.BRAVO]: this.get(RobotType.BRAVO),
      [RobotType.CHARLIE]: this.get(RobotType.CHARLIE),
      [RobotType.DELTA]: this.get(RobotType.DELTA),
    });
  }

  public toRecord(): AllocationMap {
    return {
      [RobotType.BRAVO]: this.get(RobotType.BRAVO),
      [RobotType.CHARLIE]: this.get(RobotType.CHARLIE),
      [RobotType.DELTA]: this.get(RobotType.DELTA),
    };
  }
}
