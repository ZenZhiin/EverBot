/**
 * CLI Application Controller and Interactive Terminal Interface.
 *
 * Implements terminal prompt flows and non-interactive execution modes
 * reproducing the exact format specified in EverestEngineering challenge slides.
 */

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { RobotType } from '../domain/types.js';
import { Inventory } from '../domain/inventory.js';
import { EverBotError } from '../domain/exceptions.js';
import { CategoryDistributionStrategy } from '../strategies/category_distribution.js';
import { CostOptimizedStrategy } from '../strategies/cost_optimized.js';
import { FinancialComparisonService } from '../services/financial_comparison.js';
import { StandbyOptimizer } from '../services/standby_optimizer.js';
import { MultiClientAllocator } from '../services/multi_client_allocator.js';
import { MetricsReporter } from '../services/metrics_reporter.js';

export interface CliOptions {
  readonly bravo: number;
  readonly charlie: number;
  readonly delta: number;
  readonly clientHoursInput: string;
  readonly mode?: 'level1' | 'level2' | 'compare' | 'standby' | 'multi' | 'all';
}

export function runAllocationCli(options: CliOptions): string {
  try {
    const inventory = new Inventory({
      [RobotType.BRAVO]: options.bravo,
      [RobotType.CHARLIE]: options.charlie,
      [RobotType.DELTA]: options.delta,
    });

    const l1Strategy = new CategoryDistributionStrategy();
    const l2Strategy = new CostOptimizedStrategy();
    const comparisonService = new FinancialComparisonService();
    const standbyOptimizer = new StandbyOptimizer();
    const multiAllocator = new MultiClientAllocator(l2Strategy, standbyOptimizer);
    const metricsReporter = new MetricsReporter();

    const mode = options.mode ?? 'all';
    const requests = multiAllocator.parseClientInputs(options.clientHoursInput);

    if (mode === 'multi' || requests.length > 1) {
      const batchResult = multiAllocator.allocateBatch(requests, inventory);
      const metrics = metricsReporter.calculateMetrics(batchResult);

      const lines: string[] = ['=== Multi-Client Allocation ===', ''];
      for (const rec of batchResult.clientResults) {
        lines.push(`--- ${rec.client.clientId} (${rec.hoursRequested} hours requested) ---`);
        if (rec.standbyRequired) {
          lines.push('Active Inventory Insufficient. Allocated Standby Units:');
          for (const [type, count] of Object.entries(rec.standbyAssignments)) {
            if (count > 0) lines.push(`  ${type}: ${count}`);
          }
        } else {
          lines.push('Active Fleet Allocation:');
          for (const [type, count] of Object.entries(rec.activeAssignments)) {
            if (count > 0) lines.push(`  ${type}: ${count}`);
          }
        }
        lines.push(`Total Hours Provided: ${rec.totalHoursProvided}`);
        lines.push(`Charging Cost: $${rec.totalCost}`);
        lines.push('');
      }

      lines.push(metricsReporter.formatSummaryReport(metrics));
      return lines.join('\n');
    }

    // Single client request
    const clientHours = requests[0].hoursRequested;

    if (mode === 'level1') {
      const result = l1Strategy.allocate(inventory, clientHours);
      return [
        'Robot Assignment',
        `Bravo: ${result.assignments[RobotType.BRAVO]}`,
        `Charlie: ${result.assignments[RobotType.CHARLIE]}`,
        `Delta: ${result.assignments[RobotType.DELTA]}`,
        '',
        `Total Work Hours Provided: ${result.totalHoursProvided}`,
        `Client Work Hours Requested: ${result.clientHoursRequested}`,
      ].join('\n');
    }

    if (mode === 'level2') {
      const result = l2Strategy.allocate(inventory, clientHours);
      const lines = ['Cost Optimized Allocation'];
      for (const [type, qty] of Object.entries(result.assignments)) {
        if (qty > 0) {
          lines.push(`${type}: ${qty}`);
        }
      }
      lines.push('');
      lines.push(`Total Hours Provided: ${result.totalHoursProvided}`);
      lines.push(`Total Charging Cost: $${result.totalCost}`);
      return lines.join('\n');
    }

    if (mode === 'compare') {
      const l1 = l1Strategy.allocate(inventory, clientHours);
      const l2 = l2Strategy.allocate(inventory, clientHours);
      const comp = comparisonService.compare(l1, l2);
      return comparisonService.formatReport(comp);
    }

    if (mode === 'standby') {
      const standbyResult = standbyOptimizer.evaluateStandbyRequirement(inventory, clientHours);
      return standbyOptimizer.formatReport(standbyResult);
    }

    // Default 'all' for single client
    const outputSections: string[] = [];

    // Level 1 Section
    try {
      const l1 = l1Strategy.allocate(inventory, clientHours);
      outputSections.push(
        [
          '=== Level 1: Category Distribution ===',
          'Robot Assignment',
          `Bravo: ${l1.assignments[RobotType.BRAVO]}`,
          `Charlie: ${l1.assignments[RobotType.CHARLIE]}`,
          `Delta: ${l1.assignments[RobotType.DELTA]}`,
          `Total Work Hours Provided: ${l1.totalHoursProvided}`,
          `Client Work Hours Requested: ${l1.clientHoursRequested}`,
          `Total Charging Cost: $${l1.totalCost}`,
        ].join('\n'),
      );
    } catch (e) {
      if (e instanceof EverBotError) {
        outputSections.push(`=== Level 1: Category Distribution ===\n${e.message}`);
      }
    }

    // Level 2 Section
    try {
      const l2 = l2Strategy.allocate(inventory, clientHours);
      const l2Lines = [
        '=== Level 2: Cost-Optimized Allocation ===',
        'Cost Optimized Allocation',
      ];
      for (const [type, qty] of Object.entries(l2.assignments)) {
        if (qty > 0) l2Lines.push(`${type}: ${qty}`);
      }
      l2Lines.push(`Total Hours Provided: ${l2.totalHoursProvided}`);
      l2Lines.push(`Total Charging Cost: $${l2.totalCost}`);
      outputSections.push(l2Lines.join('\n'));

      // Level 1 vs 2 Comparison
      try {
        const l1 = l1Strategy.allocate(inventory, clientHours);
        const comp = comparisonService.compare(l1, l2);
        outputSections.push(
          ['=== Level 1 vs Level 2 Comparison ===', comparisonService.formatReport(comp)].join(
            '\n',
          ),
        );
      } catch {
        // L1 might have been impossible
      }
    } catch (e) {
      if (e instanceof EverBotError) {
        outputSections.push(`=== Level 2: Cost-Optimized Allocation ===\n${e.message}`);
      }
    }

    // Level 3 Standby Section (if capacity is exceeded)
    if (clientHours > inventory.totalCapacity()) {
      const standbyResult = standbyOptimizer.evaluateStandbyRequirement(inventory, clientHours);
      outputSections.push(
        ['=== Level 3: Standby Activation ===', standbyOptimizer.formatReport(standbyResult)].join(
          '\n',
        ),
      );
    }

    return outputSections.join('\n\n');
  } catch (error) {
    if (error instanceof EverBotError) {
      return error.message;
    }
    return `Error: ${(error as Error).message}`;
  }
}

export async function startInteractiveCli(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  try {
    console.log('\n========================================');
    console.log(' EverBot Work Allocation System (CLI)');
    console.log('========================================\n');

    console.log('Enter number of robots available:');
    const bravoInput = await rl.question('Bravo: ');
    const charlieInput = await rl.question('Charlie: ');
    const deltaInput = await rl.question('Delta: ');

    const bravo = Number(bravoInput.trim());
    const charlie = Number(charlieInput.trim());
    const delta = Number(deltaInput.trim());

    console.log('\nEnter client work hours:');
    console.log('(Enter single value e.g. "16" or comma/space separated e.g. "12,16,17,10,21")');
    const hoursInput = await rl.question('Client working hours: ');

    console.log('\n----------------------------------------\n');
    const result = runAllocationCli({
      bravo,
      charlie,
      delta,
      clientHoursInput: hoursInput,
      mode: 'all',
    });

    console.log(result);
    console.log('\n----------------------------------------\n');
  } finally {
    rl.close();
  }
}
