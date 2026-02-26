import { Command } from 'commander';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { runAsyncTask } from '../lib/run-task.js';
import { error } from '../lib/output.js';
import type { SimpleImageOptions } from '../types.js';

export function registerRelightCommand(program: Command): void {
  program
    .command('relight')
    .description('Change the lighting of an image')
    .argument('<image>', 'Input image (local file path or URL)')
    .option('--prompt <text>', 'Lighting description (e.g. "sunset golden hour")')
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .option('--open', 'Open the file after downloading')
    .addHelpText('after', `
Examples:
  $ freepik relight photo.jpg --prompt "warm golden hour sunlight" -o relit.png
  $ freepik relight portrait.jpg --prompt "dramatic side lighting, dark background" -o dramatic.png
  $ freepik relight room.jpg --prompt "soft natural window light" -o bright-room.png`)
    .action(async (image: string, opts: SimpleImageOptions & { open?: boolean }) => {
      try {
        const imageValue = await getImageValue(image);
        const body: Record<string, unknown> = {
          image: imageValue,
        };
        if (opts.prompt) body.prompt = opts.prompt;

        await runAsyncTask(ENDPOINTS.relight, body, {
          download: opts.download,
          output: opts.output,
          open: opts.open,
          label: 'Relighting image...',
        });
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
