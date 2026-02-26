import { Command } from 'commander';
import { ENDPOINTS } from '../lib/models.js';
import { runAsyncTask } from '../lib/run-task.js';
import { error, c } from '../lib/output.js';
import type { IconOptions } from '../types.js';

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

        const body: Record<string, unknown> = {
          prompt,
          style: opts.style,
          output_format: opts.format,
          num_inference_steps: Number(opts.steps ?? 10),
          guidance_scale: Number(opts.guidance ?? 7),
        };

        await runAsyncTask(ENDPOINTS.icon, body, {
          download: opts.download,
          output: opts.output,
          open: opts.open,
          label: `Generating ${c.bold}${opts.style}${c.reset} icon: "${prompt}"`,
        });
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
