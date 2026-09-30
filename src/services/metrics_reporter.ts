/**
 * Bonus Feature Service: Allocation Summary & Efficiency Metrics.
 *
 * Calculates aggregate fleet utilization, cost analysis, and per-category
 * deployment metrics following multi-client allocation runs.
 */

import { RobotType } from '../domain/types.js';
import { type BatchAllocationResult } from './multi_client_allocator.js';

export interface CategoryMetric {
  readonly used: number;
  readonly initial: number;
  readonly percentage: number;
}

export interface FleetMetrics {
  readonly totalRobotsUsed: number;
  readonly totalChargingCost: number;
  readonly avgRobotUtilization: number;
  readonly categoryUtilization: Record<RobotType, CategoryMetric>;
}

export class MetricsReporter {
  public calculateMetrics(batchResult: BatchAllocationResult): FleetMetrics {
    let totalRobotsUsed = 0;
    for (const type of Object.values(RobotType)) {
      totalRobotsUsed +=
        batchResult.totalActiveRobotsUsed[type] +
        batchResult.totalStandbyRobotsUsed[type];
    }

    const totalProvided = batchResult.totalHoursProvided;
    const totalRequested = batchResult.totalHoursRequested;

    const avgRobotUtilization =
      totalProvided > 0
        ? Number(((totalRequested / totalProvided) * 100).toFixed(1))
        : 0;

    const categoryUtilization: Record<RobotType, CategoryMetric> = {
      [RobotType.BRAVO]: this.calcCategoryMetric(
        batchResult.totalActiveRobotsUsed[RobotType.BRAVO],
        batchResult.initialActiveInventory.get(RobotType.BRAVO),
      ),
      [RobotType.CHARLIE]: this.calcCategoryMetric(
        batchResult.totalActiveRobotsUsed[RobotType.CHARLIE],
        batchResult.initialActiveInventory.get(RobotType.CHARLIE),
      ),
      [RobotType.DELTA]: this.calcCategoryMetric(
        batchResult.totalActiveRobotsUsed[RobotType.DELTA],
        batchResult.initialActiveInventory.get(RobotType.DELTA),
      ),
    };

    return {
      totalRobotsUsed,
      totalChargingCost: batchResult.totalChargingCost,
      avgRobotUtilization,
      categoryUtilization,
    };
  }

  private calcCategoryMetric(used: number, initial: number): CategoryMetric {
    const percentage =
      initial > 0 ? Number(((used / initial) * 100).toFixed(1)) : 0;
    return {
      used,
      initial,
      percentage,
    };
  }

  public formatSummaryReport(metrics: FleetMetrics): string {
    const lines: string[] = [
      '--- Allocation Summary ---',
      `Total Robots Used: ${metrics.totalRobotsUsed}`,
      `Total Charging Cost: $${metrics.totalChargingCost}`,
      `Avg Robot Utilization: ${metrics.avgRobotUtilization}%`,
      '',
      '--- Efficiency Metrics ---',
      `Bravo utilization: ${metrics.categoryUtilization[RobotType.BRAVO].percentage}% (${metrics.categoryUtilization[RobotType.BRAVO].used}/${metrics.categoryUtilization[RobotType.BRAVO].initial})`,
      `Charlie utilization: ${metrics.categoryUtilization[RobotType.CHARLIE].percentage}% (${metrics.categoryUtilization[RobotType.CHARLIE].used}/${metrics.categoryUtilization[RobotType.CHARLIE].initial})`,
      `Delta utilization: ${metrics.categoryUtilization[RobotType.DELTA].percentage}% (${metrics.categoryUtilization[RobotType.DELTA].used}/${metrics.categoryUtilization[RobotType.DELTA].initial})`,
    ];

    return lines.join('\n');
  }
}
