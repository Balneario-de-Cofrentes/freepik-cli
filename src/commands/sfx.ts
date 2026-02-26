import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { downloadGenerated } from '../lib/download.js';
import { ENDPOINTS } from '../lib/models.js';
import { info, error, printJson } from '../lib/output.js';
import type { MusicOptions, TaskCreateResponse } from '../types.js';

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
        info(`Generating sound effect: "${prompt}"`);

        const body: Record<string, unknown> = {
          prompt,
        };

        const ep = ENDPOINTS.sfx;
        const res = await post<TaskCreateResponse>(ep.post, body);

        if (globals.json) {
          printJson(res);
          return;
        }

        const taskId = res.data.task_id;
        info(`Task created: ${taskId}`);

        if (!opts.download) {
          info(
            `Check status with: freepik status ${taskId} --endpoint ${ep.get}`,
          );
          return;
        }

        const result = await pollTask(ep.get, taskId, { silent: globals.json });

        if (globals.json) {
          printJson(result.raw);
          return;
        }

        await downloadGenerated(result.generated, opts.output, globals.verbose);
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
