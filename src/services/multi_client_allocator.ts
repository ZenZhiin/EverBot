/**
 * Level 4 Service: Multi-Client Batch Allocation Engine.
 *
 * Handles concurrent client work requests, prioritizes highest hour demands first,
 * guarantees single-use constraints per robot, and coordinates standby fleet activation.
 */

import {
  RobotType,
  ROBOT_SPECS,
  type AllocationMap,
  type ClientRequest,
} from '../domain/types.js';
import { Inventory } from '../domain/inventory.js';
import { InvalidInputError } from '../domain/exceptions.js';
import { AllocationStrategy } from '../strategies/base.js';
import { StandbyOptimizer, type StandbyResult } from './standby_optimizer.js';

export interface ClientAllocationRecord {
  readonly client: ClientRequest;
  readonly hoursRequested: number;
  readonly activeAssignments: AllocationMap;
  readonly standbyAssignments: AllocationMap;
  readonly totalHoursProvided: number;
  readonly excessHours: number;
  readonly activeCost: number;
  readonly standbyCost: number;
  readonly totalCost: number;
  readonly standbyRequired: boolean;
  readonly standbyDetails?: StandbyResult;
}

export interface BatchAllocationResult {
  readonly clientResults: ClientAllocationRecord[];
  readonly initialActiveInventory: Inventory;
  readonly remainingActiveInventory: Inventory;
  readonly totalActiveRobotsUsed: AllocationMap;
  readonly totalStandbyRobotsUsed: AllocationMap;
  readonly totalChargingCost: number;
  readonly totalHoursProvided: number;
  readonly totalHoursRequested: number;
}

export class MultiClientAllocator {
  private readonly strategy: AllocationStrategy;
  private readonly standbyOptimizer: StandbyOptimizer;

  constructor(
    strategy: AllocationStrategy,
    standbyOptimizer: StandbyOptimizer = new StandbyOptimizer(),
  ) {
    this.strategy = strategy;
    this.standbyOptimizer = standbyOptimizer;
  }

  /**
   * Parse single, comma-separated, or space-separated input strings into structured client requests.
   * Examples: "20", "12,16,17,10,21", "12 16 17 10 21"
   */
  public parseClientInputs(input: string): ClientRequest[] {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new InvalidInputError('Error: Work hours must be a positive integer.');
    }

    const tokens = trimmed.split(/[\s,]+/).filter((t) => t.length > 0);
    if (tokens.length === 0) {
      throw new InvalidInputError('Error: Work hours must be a positive integer.');
    }

    const requests: ClientRequest[] = [];
    tokens.forEach((token, index) => {
      const num = Number(token);
      if (!Number.isInteger(num) || num <= 0) {
        throw new InvalidInputError('Error: Work hours must be a positive integer.');
      }
      requests.push({
        clientId: `Client ${index + 1}`,
        hoursRequested: num,
      });
    });

    return requests;
  }

  /**
   * Allocate available fleet to clients, prioritized by highest hours requested first.
   */
  public allocateBatch(
    requests: ClientRequest[],
    activeInventory: Inventory,
  ): BatchAllocationResult {
    const currentInventory = activeInventory.clone();
    const initialSnapshot = activeInventory.clone();

    // Priority sorting: highest requested hours first (Slide 14)
    const sortedRequests = [...requests].sort(
      (a, b) => b.hoursRequested - a.hoursRequested,
    );

    const clientRecords: ClientAllocationRecord[] = [];
    const totalActiveUsed: AllocationMap = {
      [RobotType.BRAVO]: 0,
      [RobotType.CHARLIE]: 0,
      [RobotType.DELTA]: 0,
    };
    const totalStandbyUsed: AllocationMap = {
      [RobotType.BRAVO]: 0,
      [RobotType.CHARLIE]: 0,
      [RobotType.DELTA]: 0,
    };

    let totalBatchCost = 0;
    let totalBatchProvided = 0;
    let totalBatchRequested = 0;

    for (const req of sortedRequests) {
      totalBatchRequested += req.hoursRequested;
      const emptyMap: AllocationMap = {
        [RobotType.BRAVO]: 0,
        [RobotType.CHARLIE]: 0,
        [RobotType.DELTA]: 0,
      };

      if (currentInventory.totalCapacity() >= req.hoursRequested) {
        // Active inventory is sufficient: allocate purely from active pool
        const alloc = this.strategy.allocate(currentInventory, req.hoursRequested);
        currentInventory.consume(alloc.assignments);

        for (const type of Object.values(RobotType)) {
          totalActiveUsed[type] += alloc.assignments[type];
        }

        totalBatchCost += alloc.totalCost;
        totalBatchProvided += alloc.totalHoursProvided;

        clientRecords.push({
          client: req,
          hoursRequested: req.hoursRequested,
          activeAssignments: alloc.assignments,
          standbyAssignments: emptyMap,
          totalHoursProvided: alloc.totalHoursProvided,
          excessHours: alloc.excessHours,
          activeCost: alloc.totalCost,
          standbyCost: 0,
          totalCost: alloc.totalCost,
          standbyRequired: false,
        });
      } else {
        // Active inventory is insufficient: utilize remaining active and activate standby
        const activeCapacity = currentInventory.totalCapacity();
        let activeAssignments: AllocationMap = { ...emptyMap };
        let activeProvided = 0;
        let activeCost = 0;

        if (activeCapacity > 0) {
          // Consume all remaining active inventory
          activeAssignments = currentInventory.toRecord();
          activeProvided = activeCapacity;
          activeCost =
            activeAssignments[RobotType.BRAVO] * ROBOT_SPECS[RobotType.BRAVO].chargingCost +
            activeAssignments[RobotType.CHARLIE] * ROBOT_SPECS[RobotType.CHARLIE].chargingCost +
            activeAssignments[RobotType.DELTA] * ROBOT_SPECS[RobotType.DELTA].chargingCost;

          currentInventory.consume(activeAssignments);
          for (const type of Object.values(RobotType)) {
            totalActiveUsed[type] += activeAssignments[type];
          }
        }

        const remainingShortfall = req.hoursRequested - activeProvided;
        const standbyDetails = this.standbyOptimizer.evaluateStandbyRequirement(
          new Inventory(),
          remainingShortfall,
        );

        const standbyOpt = standbyDetails.optimalOption;
        for (const type of Object.values(RobotType)) {
          totalStandbyUsed[type] += standbyOpt.assignments[type];
        }

        const clientProvided = activeProvided + standbyOpt.totalHoursProvided;
        const clientCost = activeCost + standbyOpt.totalCost;

        totalBatchCost += clientCost;
        totalBatchProvided += clientProvided;

        clientRecords.push({
          client: req,
          hoursRequested: req.hoursRequested,
          activeAssignments,
          standbyAssignments: standbyOpt.assignments,
          totalHoursProvided: clientProvided,
          excessHours: clientProvided - req.hoursRequested,
          activeCost,
          standbyCost: standbyOpt.totalCost,
          totalCost: clientCost,
          standbyRequired: true,
          standbyDetails,
        });
      }
    }

    return {
      clientResults: clientRecords,
      initialActiveInventory: initialSnapshot,
      remainingActiveInventory: currentInventory,
      totalActiveRobotsUsed: totalActiveUsed,
      totalStandbyRobotsUsed: totalStandbyUsed,
      totalChargingCost: totalBatchCost,
      totalHoursProvided: totalBatchProvided,
      totalHoursRequested: totalBatchRequested,
    };
  }
}
