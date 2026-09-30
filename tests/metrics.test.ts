import { describe, it, expect } from 'vitest';
import { RobotType } from '../src/domain/types.js';
import { Inventory } from '../src/domain/inventory.js';
import { MultiClientAllocator } from '../src/services/multi_client_allocator.js';
import { CostOptimizedStrategy } from '../src/strategies/cost_optimized.js';
import { MetricsReporter } from '../src/services/metrics_reporter.js';

describe('Bonus Features: Allocation Summary & Efficiency Metrics', () => {
  const allocator = new MultiClientAllocator(new CostOptimizedStrategy());
  const metricsReporter = new MetricsReporter();

  it('satisfies Slide 17: processes multi-client list [16, 10, 22, 7] and calculates summary & efficiency metrics', () => {
    // Inventory: Bravo: 3 (9h), Charlie: 4 (20h), Delta: 4 (32h) -> Total: 61h
    const inventory = new Inventory({
      [RobotType.BRAVO]: 3,
      [RobotType.CHARLIE]: 4,
      [RobotType.DELTA]: 4,
    });

    const requests = allocator.parseClientInputs('16, 10, 22, 7');
    const batchResult = allocator.allocateBatch(requests, inventory);

    const metrics = metricsReporter.calculateMetrics(batchResult);

    expect(metrics.totalRobotsUsed).toBeGreaterThan(0);
    expect(metrics.totalChargingCost).toBeGreaterThan(0);
    expect(metrics.avgRobotUtilization).toBeGreaterThan(0);
    expect(metrics.avgRobotUtilization).toBeLessThanOrEqual(100);

    // Verify per-category utilization metrics exist for Bravo, Charlie, Delta
    expect(metrics.categoryUtilization[RobotType.BRAVO]).toBeDefined();
    expect(metrics.categoryUtilization[RobotType.CHARLIE]).toBeDefined();
    expect(metrics.categoryUtilization[RobotType.DELTA]).toBeDefined();

    expect(metrics.categoryUtilization[RobotType.BRAVO].initial).toBe(3);
    expect(metrics.categoryUtilization[RobotType.CHARLIE].initial).toBe(4);
    expect(metrics.categoryUtilization[RobotType.DELTA].initial).toBe(4);

    // Formatted report includes all expected sections
    const formatted = metricsReporter.formatSummaryReport(metrics);
    expect(formatted).toContain('Total Robots Used');
    expect(formatted).toContain('Total Charging Cost');
    expect(formatted).toContain('Avg Robot Utilization');
    expect(formatted).toContain('Bravo utilization');
    expect(formatted).toContain('Charlie utilization');
    expect(formatted).toContain('Delta utilization');
  });

  it('reports 100% avg robot utilization when hours provided match hours requested exactly', () => {
    const inventory = new Inventory({
      [RobotType.DELTA]: 1, // 8h
    });

    const requests = allocator.parseClientInputs('8');
    const batchResult = allocator.allocateBatch(requests, inventory);
    const metrics = metricsReporter.calculateMetrics(batchResult);

    expect(metrics.avgRobotUtilization).toBe(100);
    expect(metrics.totalChargingCost).toBe(4);
    expect(metrics.totalRobotsUsed).toBe(1);
    expect(metrics.categoryUtilization[RobotType.DELTA].percentage).toBe(100);
  });
});
