import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { downloadGenerated } from '../lib/download.js';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { openFile } from '../lib/open.js';
import { info, error, printJson, c } from '../lib/output.js';
import type { StyleTransferOptions, TaskCreateResponse } from '../types.js';

export function registerStyleTransferCommand(program: Command): void {
  program
    .command('style-transfer')
    .description('Transfer the style of a reference image to a source image')
    .argument('<image>', 'Source image (local file path or URL)')
    .requiredOption('--style <image>', 'Style reference image (local file path or URL)')
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .option('--open', 'Open the file after downloading')
    .action(async (image: string, opts: StyleTransferOptions) => {
      try {
        info('Applying style transfer...');

        const sourceImage = await getImageValue(image);
        const styleImage = await getImageValue(opts.style);

        const body: Record<string, unknown> = {
          image: sourceImage,
          style_image: styleImage,
        };

        const ep = ENDPOINTS.styleTransfer;
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
