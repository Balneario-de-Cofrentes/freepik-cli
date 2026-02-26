import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { downloadGenerated } from '../lib/download.js';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { openFile } from '../lib/open.js';
import { info, error, printJson } from '../lib/output.js';
import type { SimpleImageOptions, TaskCreateResponse } from '../types.js';

export function registerRelightCommand(program: Command): void {
  program
    .command('relight')
    .description('Change the lighting of an image')
    .argument('<image>', 'Input image (local file path or URL)')
    .option('--prompt <text>', 'Lighting description (e.g. "sunset golden hour")')
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .option('--open', 'Open the file after downloading')
    .action(async (image: string, opts: SimpleImageOptions & { open?: boolean }) => {
      try {
        info('Relighting image...');

        const imageValue = await getImageValue(image);
        const body: Record<string, unknown> = {
          image: imageValue,
        };
        if (opts.prompt) body.prompt = opts.prompt;

        const ep = ENDPOINTS.relight;
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

        const paths = await downloadGenerated(result.generated, opts.output, globals.verbose);

        if (opts.open && paths.length > 0) {
          openFile(paths[0]);
        }
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
