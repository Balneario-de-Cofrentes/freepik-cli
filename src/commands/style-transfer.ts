import { Command } from 'commander';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { runAsyncTask } from '../lib/run-task.js';
import { error } from '../lib/output.js';
import type { StyleTransferOptions } from '../types.js';

export function registerStyleTransferCommand(program: Command): void {
  program
    .command('style-transfer')
    .description('Transfer the style of a reference image to a source image')
    .argument('<image>', 'Source image (local file path or URL)')
    .requiredOption('--style <image>', 'Style reference image (local file path or URL)')
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .option('--open', 'Open the file after downloading')
    .addHelpText('after', `
Examples:
  $ freepik style-transfer photo.jpg --style painting.jpg -o styled.png
  $ freepik style-transfer selfie.jpg --style "https://example.com/art-style.jpg" -o artistic.png`)
    .action(async (image: string, opts: StyleTransferOptions) => {
      try {
        const sourceImage = await getImageValue(image);
        const styleImage = await getImageValue(opts.style);

        const body: Record<string, unknown> = {
          image: sourceImage,
          style_image: styleImage,
        };

        await runAsyncTask(ENDPOINTS.styleTransfer, body, {
          download: opts.download,
          output: opts.output,
          open: opts.open,
          label: 'Applying style transfer...',
        });
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
