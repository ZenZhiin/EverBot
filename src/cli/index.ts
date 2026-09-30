#!/usr/bin/env node
/**
 * EverBot CLI Binary Entry Point.
 */

import { runAllocationCli, startInteractiveCli, type CliOptions } from './app.js';

function parseArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
EverBot Robot Work Allocation System

Usage:
  Interactive Mode:
    npm start

  Scripted / Batch Mode:
    npm start -- [options]

Options:
    --bravo <num>        Available Bravo robots (default: 0)
    --charlie <num>      Available Charlie robots (default: 0)
    --delta <num>        Available Delta robots (default: 0)
    --hours <string>     Client hours (e.g. "16", "20", "12,16,17,10,21")
    --mode <strategy>    level1 | level2 | compare | standby | multi | all (default: all)
    --help, -h           Show this help message
`);
    return;
  }

  const hours = parseArgValue(args, '--hours');
  if (hours !== undefined) {
    const bravo = Number(parseArgValue(args, '--bravo') ?? '0');
    const charlie = Number(parseArgValue(args, '--charlie') ?? '0');
    const delta = Number(parseArgValue(args, '--delta') ?? '0');
    const mode = (parseArgValue(args, '--mode') as CliOptions['mode']) ?? 'all';

    const output = runAllocationCli({
      bravo,
      charlie,
      delta,
      clientHoursInput: hours,
      mode,
    });
    console.log(output);
    return;
  }

  // Interactive mode
  await startInteractiveCli();
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
