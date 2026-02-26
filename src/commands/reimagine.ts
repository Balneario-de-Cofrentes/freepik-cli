import { Command } from 'commander';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { runAsyncTask } from '../lib/run-task.js';
import { error } from '../lib/output.js';
import type { ReimagineOptions } from '../types.js';

const VALID_IMAGINATION = ['wild', 'subtle', 'vivid'] as const;

export function registerReimagineCommand(program: Command): void {
  program
    .command('reimagine')
    .description('Reimagine an image with a different style')
    .argument('<image>', 'Input image (local file path or URL)')
    .option('--prompt <text>', 'Text guidance for reimagining')
    .option(
      '--imagination <level>',
      `Imagination level (${VALID_IMAGINATION.join(', ')})`,
    )
    .option('--aspect-ratio <ratio>', 'Aspect ratio for output')
    .option('--webhook <url>', 'Webhook URL for completion notification')
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .option('--open', 'Open the file after downloading')
    .addHelpText('after', `
Examples:
  $ freepik reimagine photo.jpg -o reimagined.png
  $ freepik reimagine photo.jpg --prompt "cyberpunk neon city" --imagination wild -o cyber.png
  $ freepik reimagine landscape.jpg --prompt "watercolor painting" --imagination vivid -o painted.png
  $ freepik reimagine photo.jpg --aspect-ratio widescreen_16_9 -o wide.png`)
    .action(async (image: string, opts: ReimagineOptions) => {
      try {
        if (
          opts.imagination &&
          !VALID_IMAGINATION.includes(opts.imagination as (typeof VALID_IMAGINATION)[number])
        ) {
          throw new Error(
            `Invalid imagination level "${opts.imagination}". Use: ${VALID_IMAGINATION.join(', ')}`,
          );
        }

        const imageValue = await getImageValue(image);
        const body: Record<string, unknown> = {
          image: imageValue,
        };

        if (opts.prompt) body.prompt = opts.prompt;
        if (opts.imagination) body.imagination = opts.imagination;
        if (opts.aspectRatio) body.aspect_ratio = opts.aspectRatio;
        if (opts.webhook) body.webhook = opts.webhook;

        await runAsyncTask(ENDPOINTS.reimagine, body, {
          download: opts.download,
          output: opts.output,
          open: opts.open,
          label: 'Reimagining image...',
        });
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
