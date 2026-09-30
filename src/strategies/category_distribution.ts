/**
 * Level 1 Strategy: Robot Category Distribution.
 *
 * Ensures all robot categories (Bravo, Charlie, Delta) are evaluated,
 * while strictly minimizing excess working hours delivered.
 */

import { RobotType, ROBOT_SPECS, type AllocationResult } from '../domain/types.js';
import { Inventory } from '../domain/inventory.js';
import { ImpossibleAllocationError } from '../domain/exceptions.js';
import { BaseAllocationStrategy } from './base.js';

export class CategoryDistributionStrategy extends BaseAllocationStrategy {
  public allocate(inventory: Inventory, clientHours: number): AllocationResult {
    this.validateInputs(inventory, clientHours);

    // Enforce diversity: each robot category must have at least 1 unit available
    const categories = [RobotType.BRAVO, RobotType.CHARLIE, RobotType.DELTA];
    for (const cat of categories) {
      if (inventory.get(cat) < 1) {
        throw new ImpossibleAllocationError(
          'Error: Unable to allocate at least one robot from each category with the available inventory.',
        );
      }
    }

    const maxB = inventory.get(RobotType.BRAVO);
    const maxC = inventory.get(RobotType.CHARLIE);
    const maxD = inventory.get(RobotType.DELTA);

    let bestCombo: [number, number, number] | null = null;
    let minExcess = Infinity;
    let minCost = Infinity;
    let minRobots = Infinity;

    // Search space: at least 1 robot per category up to available inventory
    for (let b = 1; b <= maxB; b++) {
      for (let c = 1; c <= maxC; c++) {
        for (let d = 1; d <= maxD; d++) {
          const hours =
            b * ROBOT_SPECS[RobotType.BRAVO].workingHours +
            c * ROBOT_SPECS[RobotType.CHARLIE].workingHours +
            d * ROBOT_SPECS[RobotType.DELTA].workingHours;

          if (hours >= clientHours) {
            const excess = hours - clientHours;
            const cost =
              b * ROBOT_SPECS[RobotType.BRAVO].chargingCost +
              c * ROBOT_SPECS[RobotType.CHARLIE].chargingCost +
              d * ROBOT_SPECS[RobotType.DELTA].chargingCost;
            const robots = b + c + d;

            let isBetter = false;
            if (excess < minExcess) {
              isBetter = true;
            } else if (excess === minExcess) {
              if (cost < minCost) {
                isBetter = true;
              } else if (cost === minCost && robots < minRobots) {
                isBetter = true;
              }
            }

            if (isBetter) {
              minExcess = excess;
              minCost = cost;
              minRobots = robots;
              bestCombo = [b, c, d];
            }
          }
        }
      }
    }

    if (!bestCombo) {
      throw new ImpossibleAllocationError(
        'Error: Unable to allocate at least one robot from each category with the available inventory.',
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
