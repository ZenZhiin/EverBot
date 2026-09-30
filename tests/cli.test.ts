import { describe, it, expect } from 'vitest';
import { runAllocationCli } from '../src/cli/app.js';

describe('CLI Application Controller', () => {
  it('processes Slide 7 Level 1 allocation via CLI controller', () => {
    const output = runAllocationCli({
      bravo: 2,
      charlie: 3,
      delta: 2,
      clientHoursInput: '16',
      mode: 'level1',
    });

    expect(output).toContain('Robot Assignment');
    expect(output).toContain('Bravo: 1');
    expect(output).toContain('Charlie: 1');
    expect(output).toContain('Delta: 1');
    expect(output).toContain('Total Work Hours Provided: 16');
    expect(output).toContain('Client Work Hours Requested: 16');
  });

  it('processes Slide 9 Level 2 allocation via CLI controller', () => {
    const output = runAllocationCli({
      bravo: 2,
      charlie: 3,
      delta: 2,
      clientHoursInput: '20',
      mode: 'level2',
    });

    expect(output).toContain('Cost Optimized Allocation');
    expect(output).toContain('Charlie: 1');
    expect(output).toContain('Delta: 2');
    expect(output).toContain('Total Hours Provided: 21');
    expect(output).toContain('Total Charging Cost: $11');
  });

  it('processes Slide 10 Level 1 vs Level 2 comparison via CLI controller', () => {
    const output = runAllocationCli({
      bravo: 2,
      charlie: 3,
      delta: 2,
      clientHoursInput: '20',
      mode: 'compare',
    });

    expect(output).toContain('Level 1 Cost: $12');
    expect(output).toContain('Level 2 Cost: $11');
    expect(output).toContain('Cost Difference: $1');
    expect(output).toContain('Level 1 strategy resulted in $1 additional cost');
  });

  it('processes Slide 12 Level 3 standby activation via CLI controller', () => {
    const output = runAllocationCli({
      bravo: 1,
      charlie: 1,
      delta: 1,
      clientHoursInput: '21',
      mode: 'standby',
    });

    expect(output).toContain('Active Robot Capacity: 16 hours');
    expect(output).toContain('Client Work Requested: 21 hours');
    expect(output).toContain('Additional Standby Robots Required:');
    expect(output).toContain('Charlie: 1');
    expect(output).toContain("as it's the cost optimised one");
  });

  it('processes Slide 14 & 17 Multi-Client allocation with metrics via CLI controller', () => {
    const output = runAllocationCli({
      bravo: 3,
      charlie: 4,
      delta: 4,
      clientHoursInput: '16, 10, 22, 7',
      mode: 'multi',
    });

    expect(output).toContain('Multi-Client Allocation');
    expect(output).toContain('Client');
    expect(output).toContain('Allocation Summary');
    expect(output).toContain('Total Robots Used');
    expect(output).toContain('Total Charging Cost');
    expect(output).toContain('Avg Robot Utilization');
    expect(output).toContain('Efficiency Metrics');
  });

  it('returns clean error message on zero robots', () => {
    const output = runAllocationCli({
      bravo: 0,
      charlie: 0,
      delta: 0,
      clientHoursInput: '16',
      mode: 'level1',
    });

    expect(output).toBe('Error: No robots available for assignment.');
  });

  it('returns clean error message on invalid input', () => {
    const output = runAllocationCli({
      bravo: 2,
      charlie: 2,
      delta: 2,
      clientHoursInput: '-5',
      mode: 'level1',
    });

    expect(output).toBe('Error: Work hours must be a positive integer.');
  });
});
