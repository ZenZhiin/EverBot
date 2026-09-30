/**
 * Domain-specific exception hierarchy for EverBot Solutions.
 */

export class EverBotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidInputError extends EverBotError {
  constructor(message: string = 'Work hours must be a positive integer.') {
    const formatted = message.startsWith('Error: ') ? message : `Error: ${message}`;
    super(formatted);
  }
}

export class ZeroRobotsError extends EverBotError {
  constructor(message: string = 'Error: No robots available for assignment.') {
    super(message);
  }
}

export class ImpossibleAllocationError extends EverBotError {
  constructor(
    message: string = 'Error: Unable to allocate at least one robot from each category with the available inventory.',
  ) {
    super(message);
  }
}

export class InsufficientCapacityError extends EverBotError {
  constructor(
    message: string = 'Error: Insufficient robot capacity to complete the requested work.',
  ) {
    super(message);
  }
}
