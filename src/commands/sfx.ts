import { Command } from 'commander';
import { ENDPOINTS } from '../lib/models.js';
import { runAsyncTask } from '../lib/run-task.js';
import { error } from '../lib/output.js';
import type { MusicOptions } from '../types.js';

export function registerSfxCommand(program: Command): void {
  program
    .command('sfx')
    .description('Generate sound effects from a text description')
    .argument('<prompt>', 'Text description of the sound effect (e.g. "door creaking open")')
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .addHelpText('after', `
Examples:
  $ freepik sfx "door creaking open slowly" -o creak.mp3
  $ freepik sfx "laser gun firing, sci-fi" -o laser.mp3
  $ freepik sfx "rain on window, gentle, ambient" -o rain.mp3
  $ freepik sfx "crowd cheering in stadium" -o cheer.mp3`)
    .action(async (prompt: string, opts: MusicOptions) => {
      try {
        const body: Record<string, unknown> = {
          prompt,
        };

        await runAsyncTask(ENDPOINTS.sfx, body, {
          download: opts.download,
          output: opts.output,
          label: `Generating sound effect: "${prompt}"`,
        });
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
