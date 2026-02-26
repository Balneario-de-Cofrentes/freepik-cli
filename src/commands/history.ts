import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { readHistory, getHistoryPath } from '../lib/history.js';
import { info, error, printJson, c } from '../lib/output.js';
import type { HistoryOptions } from '../types.js';

export function registerHistoryCommand(program: Command): void {
  program
    .command('history')
    .description('Show generation history')
    .option('--limit <n>', 'Number of entries to show', '20')
    .option('--search <term>', 'Filter by prompt text')
    .option('--total-cost', 'Show accumulated estimated cost')
    .action(async (opts: HistoryOptions) => {
      try {
        let entries = await readHistory();

        if (entries.length === 0) {
          info(`No history found. History is stored at: ${c.dim}${getHistoryPath()}${c.reset}`);
          return;
        }

        // Filter by search term
        if (opts.search) {
          const term = opts.search.toLowerCase();
          entries = entries.filter(
            (e) => e.prompt?.toLowerCase().includes(term) || e.command?.toLowerCase().includes(term),
          );
        }

        // Total cost mode
        if (opts.totalCost) {
          if (globals.json) {
            const costs = entries
              .filter((e) => e.cost)
              .map((e) => parseFloat(e.cost!.replace(/[^0-9.]/g, '')))
              .filter((n) => !isNaN(n));
            const total = costs.reduce((a, b) => a + b, 0);
            printJson({ totalEntries: entries.length, estimatedTotalCost: `~\u20ac${total.toFixed(2)}` });
            return;
          }

          const costs = entries
            .filter((e) => e.cost)
            .map((e) => parseFloat(e.cost!.replace(/[^0-9.]/g, '')))
            .filter((n) => !isNaN(n));
          const total = costs.reduce((a, b) => a + b, 0);

          console.log();
          console.log(`${c.bold}Generation History Summary${c.reset}`);
          console.log(`  Total entries:     ${entries.length}`);
          console.log(`  Estimated cost:    ${c.bold}~\u20ac${total.toFixed(2)}${c.reset}`);
          console.log();
          return;
        }

        const limit = Math.max(1, Number(opts.limit ?? 20));
        const shown = entries.slice(-limit);

        if (globals.json) {
          printJson(shown);
          return;
        }

        console.log();
        console.log(`${c.bold}Generation History${c.reset} ${c.dim}(last ${shown.length} of ${entries.length})${c.reset}`);
        console.log();

        const timeW = 20;
        const cmdW = 12;
        const modelW = 16;
        const promptW = 36;

        console.log(
          `  ${c.dim}${'Time'.padEnd(timeW)}  ${'Command'.padEnd(cmdW)}  ${'Model'.padEnd(modelW)}  ${'Prompt'.padEnd(promptW)}${c.reset}`,
        );
        console.log(
          `  ${c.dim}${'-'.repeat(timeW)}  ${'-'.repeat(cmdW)}  ${'-'.repeat(modelW)}  ${'-'.repeat(promptW)}${c.reset}`,
        );

        for (const entry of shown) {
          const time = entry.timestamp
            ? new Date(entry.timestamp).toLocaleString().slice(0, timeW).padEnd(timeW)
            : '-'.padEnd(timeW);
          const cmd = (entry.command ?? '-').slice(0, cmdW).padEnd(cmdW);
          const model = (entry.model ?? '-').slice(0, modelW).padEnd(modelW);
          const prompt = (entry.prompt ?? '-').slice(0, promptW).padEnd(promptW);
          console.log(`  ${time}  ${cmd}  ${model}  ${prompt}`);
        }

        console.log();
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
