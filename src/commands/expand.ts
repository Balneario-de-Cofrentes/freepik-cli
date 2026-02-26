import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { downloadGenerated } from '../lib/download.js';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { openFile } from '../lib/open.js';
import { info, error, printJson, c } from '../lib/output.js';
import type { ExpandOptions, TaskCreateResponse } from '../types.js';

const VALID_ENGINES = ['flux-pro', 'ideogram', 'seedream-v4-5'] as const;

export function registerExpandCommand(program: Command): void {
  program
    .command('expand')
    .description('Expand/outpaint an image')
    .argument('<image>', 'Input image (local file path or URL)')
    .option('--left <px>', 'Pixels to expand left (0-2048)', '0')
    .option('--right <px>', 'Pixels to expand right (0-2048)', '0')
    .option('--top <px>', 'Pixels to expand top (0-2048)', '0')
    .option('--bottom <px>', 'Pixels to expand bottom (0-2048)', '0')
    .option('--prompt <text>', 'Text guidance for expansion')
    .option(
      '--engine <engine>',
      'Engine (flux-pro, ideogram, seedream-v4-5)',
      'flux-pro',
    )
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .option('--open', 'Open the file after downloading')
    .addHelpText('after', `
Examples:
  $ freepik expand photo.jpg --right 200 --left 200 -o wider.png
  $ freepik expand portrait.jpg --top 300 --bottom 100 -o taller.png
  $ freepik expand scene.jpg --right 500 --prompt "continue the landscape" -o expanded.png
  $ freepik expand photo.jpg --top 200 --bottom 200 --left 200 --right 200 -o padded.png
  $ freepik expand photo.jpg --engine seedream-v4-5 --right 300 -o expanded.png

Engines: flux-pro (default), ideogram, seedream-v4-5`)
    .action(async (image: string, opts: ExpandOptions & { open?: boolean }) => {
      try {
        const engine = (opts.engine ?? 'flux-pro') as keyof typeof ENDPOINTS.expand;
        if (!VALID_ENGINES.includes(engine as (typeof VALID_ENGINES)[number])) {
          throw new Error(
            `Invalid engine "${engine}". Use: ${VALID_ENGINES.join(', ')}`,
          );
        }

        const left = Number(opts.left ?? 0);
        const right = Number(opts.right ?? 0);
        const top = Number(opts.top ?? 0);
        const bottom = Number(opts.bottom ?? 0);

        if (left + right + top + bottom === 0) {
          throw new Error(
            'At least one expand direction must be > 0. Use --left, --right, --top, --bottom',
          );
        }

        info(
          `Expanding image (L:${left} R:${right} T:${top} B:${bottom}) with ${c.bold}${engine}${c.reset}...`,
        );

        const imageValue = await getImageValue(image);
        const body: Record<string, unknown> = {
          image: imageValue,
          expand_left: left,
          expand_right: right,
          expand_up: top,
          expand_down: bottom,
        };
        if (opts.prompt) body.prompt = opts.prompt;

        const ep = ENDPOINTS.expand[engine as keyof typeof ENDPOINTS.expand];
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
