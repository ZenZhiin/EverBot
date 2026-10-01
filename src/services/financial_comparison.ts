/**
 * Financial comparison service between Level 1 and Level 2 allocation strategies.
 * Evaluates the cost impact of the performance testing / category diversity constraint.
 */

import { type AllocationResult } from '../domain/types.js';

export interface ComparisonReport {
  readonly level1Cost: number;
  readonly level2Cost: number;
  readonly costDifference: number;
  readonly insight: string;
}

export class FinancialComparisonService {
  public compare(level1: AllocationResult, level2: AllocationResult): ComparisonReport {
    const diff = level1.totalCost - level2.totalCost;

    let insight: string;
    if (diff > 0) {
      insight = `Level 1 strategy resulted in $${diff} additional cost due to mandatory usage of multiple robot categories.`;
    } else if (diff === 0) {
      insight = `Level 1 and Level 2 strategies both achieved the optimal cost of $${level1.totalCost}.`;
    } else {
      insight = `Level 1 strategy was $${Math.abs(diff)} cheaper than Level 2.`;
    }

    return {
      level1Cost: level1.totalCost,
      level2Cost: level2.totalCost,
      costDifference: diff,
      insight,
    };
  }

  public formatReport(report: ComparisonReport): string {
    return [
      `Level 1 Cost: $${report.level1Cost}`,
      `Level 2 Cost: $${report.level2Cost}`,
      '',
      `Cost Difference: $${Math.abs(report.costDifference)}`,
      '',
      'Insight:',
      report.insight,
    ].join('\n');
  }
}
