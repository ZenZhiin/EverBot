/**
 * Domain types and value objects for the EverBot Robot Allocation System.
 */

export enum RobotType {
  BRAVO = 'Bravo',
  CHARLIE = 'Charlie',
  DELTA = 'Delta',
}

export interface RobotSpec {
  readonly workingHours: number;
  readonly chargingCost: number;
}

export const ROBOT_SPECS: Readonly<Record<RobotType, RobotSpec>> = Object.freeze({
  [RobotType.BRAVO]: { workingHours: 3, chargingCost: 2 },
  [RobotType.CHARLIE]: { workingHours: 5, chargingCost: 3 },
  [RobotType.DELTA]: { workingHours: 8, chargingCost: 4 },
});

export type AllocationMap = Record<RobotType, number>;

export interface ClientRequest {
  readonly clientId: string;
  readonly hoursRequested: number;
}

export interface AllocationResult {
  readonly assignments: AllocationMap;
  readonly clientHoursRequested: number;
  readonly totalHoursProvided: number;
  readonly excessHours: number;
  readonly totalCost: number;
  readonly totalRobotsUsed: number;
  readonly isSuccessful: boolean;
  readonly errorMessage?: string;
}

export function getCostPerHour(type: RobotType): number {
  const spec = ROBOT_SPECS[type];
  return spec.chargingCost / spec.workingHours;
}

export function parseRobotType(name: string): RobotType {
  const normalized = name.trim().toLowerCase();
  for (const type of Object.values(RobotType)) {
    if (type.toLowerCase() === normalized) {
      return type;
    }
  }
  throw new Error(`Unknown robot type: "${name}"`);
}
