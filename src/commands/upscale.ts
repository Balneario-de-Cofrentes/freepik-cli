import { Command } from 'commander';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { runAsyncTask } from '../lib/run-task.js';
import { error, c } from '../lib/output.js';
import type { UpscaleOptions } from '../types.js';

const SCALE_MAP: Record<string, number> = {
  '2x': 2,
  '4x': 4,
  '8x': 8,
  '16x': 16,
};

export function registerUpscaleCommand(program: Command): void {
  program
    .command('upscale')
    .description('Upscale an image using AI')
    .argument('<image>', 'Input image (local file path or URL)')
    .option('--scale <scale>', 'Scale factor (2x, 4x, 8x, 16x)', '2x')
    .option(
      '--optimized-for <type>',
      'Optimization target (standard, soft_portraits, hard_portraits, art_n_illustration, videogame_assets, nature_n_landscapes, films_n_photography, 3d_renders, science_fiction_n_horror)',
    )
    .option('--prompt <text>', 'Text guidance for upscaling')
    .option('--creativity <n>', 'Creativity level -10 to 10', '0')
    .option('--hdr <n>', 'HDR level -10 to 10', '0')
    .option('--resemblance <n>', 'Resemblance level -10 to 10', '0')
    .option(
      '--engine <engine>',
      'Engine (automatic, magnific_illusio, magnific_sharpy, magnific_sparkle)',
    )
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .option('--open', 'Open the file after downloading')
    .addHelpText('after', `
Examples:
  $ freepik upscale photo.jpg -o photo-hd.png
  $ freepik upscale photo.jpg --scale 4x -o photo-4x.png
  $ freepik upscale portrait.jpg --scale 2x --optimized-for soft_portraits -o portrait-hd.png
  $ freepik upscale artwork.png --scale 4x --optimized-for art_n_illustration -o artwork-4x.png
  $ freepik upscale photo.jpg --prompt "enhance details, sharp focus" --creativity 5 -o enhanced.png
  $ freepik upscale https://example.com/image.jpg --scale 2x -o upscaled.png   # Works with URLs too`)
    .action(async (image: string, opts: UpscaleOptions & { open?: boolean }) => {
      try {
        const scaleNum = SCALE_MAP[opts.scale];
        if (!scaleNum) {
          throw new Error(
            `Invalid scale "${opts.scale}". Use: ${Object.keys(SCALE_MAP).join(', ')}`,
          );
        }

        const imageValue = await getImageValue(image);
        const body: Record<string, unknown> = {
          image: imageValue,
          scale_factor: scaleNum,
          creativity: Number(opts.creativity ?? 0),
          hdr: Number(opts.hdr ?? 0),
          resemblance: Number(opts.resemblance ?? 0),
        };

        if (opts.optimizedFor) body.optimized_for = opts.optimizedFor;
        if (opts.prompt) body.prompt = opts.prompt;
        if (opts.engine) body.engine = opts.engine;

        await runAsyncTask(ENDPOINTS.upscale, body, {
          download: opts.download,
          output: opts.output,
          open: opts.open,
          label: `Upscaling image (${c.bold}${opts.scale}${c.reset})...`,
        });
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
