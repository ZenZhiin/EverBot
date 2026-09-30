/**
 * Level 2 Strategy: Cost-Optimized Allocation.
 *
 * Allocates robots purely to minimize total charging costs while fulfilling
 * client work hours, using excess working hours as a secondary tie-breaker.
 */

import { RobotType, ROBOT_SPECS, type AllocationResult } from '../domain/types.js';
import { Inventory } from '../domain/inventory.js';
import { InsufficientCapacityError } from '../domain/exceptions.js';
import { BaseAllocationStrategy } from './base.js';

export class CostOptimizedStrategy extends BaseAllocationStrategy {
  public allocate(inventory: Inventory, clientHours: number): AllocationResult {
    this.validateInputs(inventory, clientHours);

    const maxB = inventory.get(RobotType.BRAVO);
    const maxC = inventory.get(RobotType.CHARLIE);
    const maxD = inventory.get(RobotType.DELTA);

    let bestCombo: [number, number, number] | null = null;
    let minCost = Infinity;
    let minExcess = Infinity;
    let minRobots = Infinity;

    for (let b = 0; b <= maxB; b++) {
      for (let c = 0; c <= maxC; c++) {
        for (let d = 0; d <= maxD; d++) {
          if (b === 0 && c === 0 && d === 0) {
            continue;
          }

          const hours =
            b * ROBOT_SPECS[RobotType.BRAVO].workingHours +
            c * ROBOT_SPECS[RobotType.CHARLIE].workingHours +
            d * ROBOT_SPECS[RobotType.DELTA].workingHours;

          if (hours >= clientHours) {
            const cost =
              b * ROBOT_SPECS[RobotType.BRAVO].chargingCost +
              c * ROBOT_SPECS[RobotType.CHARLIE].chargingCost +
              d * ROBOT_SPECS[RobotType.DELTA].chargingCost;
            const excess = hours - clientHours;
            const robots = b + c + d;

            let isBetter = false;
            // 1. Primary: Minimise Total Charging Cost
            if (cost < minCost) {
              isBetter = true;
            } else if (cost === minCost) {
              // 2. Secondary tie-breaker: Minimise excess hours
              if (excess < minExcess) {
                isBetter = true;
              } else if (excess === minExcess && robots < minRobots) {
                // 3. Tertiary tie-breaker: Minimise physical robots used
                isBetter = true;
              }
            }

            if (isBetter) {
              minCost = cost;
              minExcess = excess;
              minRobots = robots;
              bestCombo = [b, c, d];
            }
          }
        }
      }
    }

    if (!bestCombo) {
      throw new InsufficientCapacityError(
        'Error: Insufficient robot capacity to complete the requested work.',
      );
    }

    const [b, c, d] = bestCombo;
    const totalProvided =
      b * ROBOT_SPECS[RobotType.BRAVO].workingHours +
      c * ROBOT_SPECS[RobotType.CHARLIE].workingHours +
      d * ROBOT_SPECS[RobotType.DELTA].workingHours;

    return {
      assignments: {
        [RobotType.BRAVO]: b,
        [RobotType.CHARLIE]: c,
        [RobotType.DELTA]: d,
      },
      clientHoursRequested: clientHours,
      totalHoursProvided: totalProvided,
      excessHours: totalProvided - clientHours,
      totalCost: minCost,
      totalRobotsUsed: b + c + d,
      isSuccessful: true,
    };
  }
}
