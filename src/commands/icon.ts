import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { downloadGenerated } from '../lib/download.js';
import { ENDPOINTS } from '../lib/models.js';
import { openFile } from '../lib/open.js';
import { info, error, printJson, c } from '../lib/output.js';
import type { IconOptions, TaskCreateResponse } from '../types.js';

const VALID_STYLES = ['solid', 'outline', 'color', 'flat', 'sticker'] as const;
const VALID_FORMATS = ['png', 'svg'] as const;

export function registerIconCommand(program: Command): void {
  program
    .command('icon')
    .description('Generate icons from text descriptions')
    .argument('<prompt>', 'Text description of the icon')
    .option(
      '--style <style>',
      `Icon style (${VALID_STYLES.join(', ')})`,
      'solid',
    )
    .option('--format <fmt>', `Output format (${VALID_FORMATS.join(', ')})`, 'png')
    .option('--steps <n>', 'Number of steps (10-50)', '10')
    .option('--guidance <n>', 'Guidance scale (0-10)', '7')
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .option('--open', 'Open the file after downloading')
    .addHelpText('after', `
Examples:
  $ freepik icon "shopping cart" -o cart.png
  $ freepik icon "notification bell" --style outline --format svg -o bell.svg
  $ freepik icon "home" --style flat --format png -o home.png
  $ freepik icon "settings gear" --style sticker --steps 30 -o gear.png
  $ freepik icon "play button" --guidance 9 -o play.png

Styles: solid (default), outline, color, flat, sticker`)
    .action(async (prompt: string, opts: IconOptions & { open?: boolean }) => {
      try {
        if (!VALID_STYLES.includes(opts.style as (typeof VALID_STYLES)[number])) {
          throw new Error(
            `Invalid style "${opts.style}". Use: ${VALID_STYLES.join(', ')}`,
          );
        }
        if (!VALID_FORMATS.includes(opts.format as (typeof VALID_FORMATS)[number])) {
          throw new Error(
            `Invalid format "${opts.format}". Use: ${VALID_FORMATS.join(', ')}`,
          );
        }

        info(
          `Generating ${c.bold}${opts.style}${c.reset} icon: "${prompt}"`,
        );

        const body: Record<string, unknown> = {
          prompt,
          style: opts.style,
          output_format: opts.format,
          num_inference_steps: Number(opts.steps ?? 10),
          guidance_scale: Number(opts.guidance ?? 7),
        };

        const ep = ENDPOINTS.icon;
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
