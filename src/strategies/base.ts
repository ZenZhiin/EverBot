/**
 * Core interface and abstract base class for allocation strategies.
 */

import { Inventory } from '../domain/inventory.js';
import { AllocationResult } from '../domain/types.js';
import {
  InvalidInputError,
  ZeroRobotsError,
  InsufficientCapacityError,
} from '../domain/exceptions.js';

export interface AllocationStrategy {
  allocate(inventory: Inventory, clientHours: number): AllocationResult;
}

export abstract class BaseAllocationStrategy implements AllocationStrategy {
  public abstract allocate(inventory: Inventory, clientHours: number): AllocationResult;

  protected validateInputs(inventory: Inventory, clientHours: number): void {
    if (!Number.isInteger(clientHours) || clientHours <= 0) {
      throw new InvalidInputError('Work hours must be a positive integer.');
    }

    if (inventory.totalCount() === 0) {
      throw new ZeroRobotsError('Error: No robots available for assignment.');
    }

    if (inventory.totalCapacity() < clientHours) {
      throw new InsufficientCapacityError(
        'Error: Insufficient robot capacity to complete the requested work.',
      );
    }
  }
}
