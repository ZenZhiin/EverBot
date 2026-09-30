/**
 * Level 3 Service: Standby Robot Activation & Warehouse Optimization.
 *
 * When active fleet capacity is insufficient, calculates the shortfall and
 * identifies all non-redundant standby options, highlighting the cost-optimal choice.
 */

import { RobotType, ROBOT_SPECS, type AllocationMap } from '../domain/types.js';
import { Inventory } from '../domain/inventory.js';

export interface StandbyOption {
  readonly assignments: AllocationMap;
  readonly totalHoursProvided: number;
  readonly totalCost: number;
  readonly excessHours: number;
  readonly isCostOptimal: boolean;
}

export interface StandbyResult {
  readonly activeCapacity: number;
  readonly clientHoursRequested: number;
  readonly shortfallHours: number;
  readonly allOptions: StandbyOption[];
  readonly optimalOption: StandbyOption;
}

export class StandbyOptimizer {
  public evaluateStandbyRequirement(
    activeInventory: Inventory,
    clientHours: number,
  ): StandbyResult {
    const activeCapacity = activeInventory.totalCapacity();

    if (clientHours <= activeCapacity) {
      const emptyAssignments: AllocationMap = {
        [RobotType.BRAVO]: 0,
        [RobotType.CHARLIE]: 0,
        [RobotType.DELTA]: 0,
      };
      const zeroOption: StandbyOption = {
        assignments: emptyAssignments,
        totalHoursProvided: 0,
        totalCost: 0,
        excessHours: 0,
        isCostOptimal: true,
      };
      return {
        activeCapacity,
        clientHoursRequested: clientHours,
        shortfallHours: 0,
        allOptions: [],
        optimalOption: zeroOption,
      };
    }

    const shortfall = clientHours - activeCapacity;
    const allMinimalOptions = this.findMinimalStandbyOptions(shortfall);

    // Sort options to pick the cost-optimal option
    allMinimalOptions.sort((a, b) => {
      if (a.totalCost !== b.totalCost) {
        return a.totalCost - b.totalCost;
      }
      if (a.excessHours !== b.excessHours) {
        return a.excessHours - b.excessHours;
      }
      return (
        a.assignments[RobotType.BRAVO] +
        a.assignments[RobotType.CHARLIE] +
        a.assignments[RobotType.DELTA] -
        (b.assignments[RobotType.BRAVO] +
          b.assignments[RobotType.CHARLIE] +
          b.assignments[RobotType.DELTA])
      );
    });

    const optimal = allMinimalOptions[0];
    const optionsWithOptimalFlag = allMinimalOptions.map((opt) => ({
      ...opt,
      isCostOptimal: opt === optimal,
    }));

    return {
      activeCapacity,
      clientHoursRequested: clientHours,
      shortfallHours: shortfall,
      allOptions: optionsWithOptimalFlag,
      optimalOption: { ...optimal, isCostOptimal: true },
    };
  }

  private findMinimalStandbyOptions(shortfall: number): StandbyOption[] {
    const maxB = Math.ceil(shortfall / ROBOT_SPECS[RobotType.BRAVO].workingHours);
    const maxC = Math.ceil(shortfall / ROBOT_SPECS[RobotType.CHARLIE].workingHours);
    const maxD = Math.ceil(shortfall / ROBOT_SPECS[RobotType.DELTA].workingHours);

    const results: StandbyOption[] = [];

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

          if (hours >= shortfall) {
            // Check minimality (no robot is redundant)
            const bravoRedundant =
              b > 0 && hours - ROBOT_SPECS[RobotType.BRAVO].workingHours >= shortfall;
            const charlieRedundant =
              c > 0 && hours - ROBOT_SPECS[RobotType.CHARLIE].workingHours >= shortfall;
            const deltaRedundant =
              d > 0 && hours - ROBOT_SPECS[RobotType.DELTA].workingHours >= shortfall;

            if (!bravoRedundant && !charlieRedundant && !deltaRedundant) {
              const cost =
                b * ROBOT_SPECS[RobotType.BRAVO].chargingCost +
                c * ROBOT_SPECS[RobotType.CHARLIE].chargingCost +
                d * ROBOT_SPECS[RobotType.DELTA].chargingCost;

              results.push({
                assignments: {
                  [RobotType.BRAVO]: b,
                  [RobotType.CHARLIE]: c,
                  [RobotType.DELTA]: d,
                },
                totalHoursProvided: hours,
                totalCost: cost,
                excessHours: hours - shortfall,
                isCostOptimal: false,
              });
            }
          }
        }
      }
    }

    return results;
  }

  public formatReport(result: StandbyResult): string {
    const lines: string[] = [
      `Active Robot Capacity: ${result.activeCapacity} hours`,
      `Client Work Requested: ${result.clientHoursRequested} hours`,
      '',
      'Additional Standby Robots Required:',
    ];

    const optionStrings = result.allOptions.map((opt) => {
      const parts = Object.entries(opt.assignments)
        .filter(([, qty]) => qty > 0)
        .map(([type, qty]) => `${type}: ${qty}`);
      return `${parts.join(', ')} - cost $${opt.totalCost}`;
    });

    lines.push(optionStrings.join('\nor\n'));
    lines.push('');

    const optimalParts = Object.entries(result.optimalOption.assignments)
      .filter(([, qty]) => qty > 0)
      .map(([type, qty]) => `${type}: ${qty}`)
      .join(', ');

    lines.push(
      `The output should show ${optimalParts} as it's the cost optimised one`,
    );

    return lines.join('\n');
  }
}
