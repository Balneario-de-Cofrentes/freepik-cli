import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { info, error, printJson, c } from '../lib/output.js';
import type { ClassifyOptions } from '../types.js';

export function registerClassifyCommand(program: Command): void {
  program
    .command('classify')
    .description('Detect if an image is AI-generated')
    .argument('<image>', 'Input image (local file path or URL)')
    .addHelpText('after', `
Examples:
  $ freepik classify suspicious-photo.jpg
  $ freepik classify https://example.com/image.jpg

Returns a confidence score (0-1) indicating if the image is AI-generated.`)
    .action(async (image: string, opts: ClassifyOptions) => {
      try {
        info('Analyzing image...');

        const imageValue = await getImageValue(image);
        const body: Record<string, unknown> = {
          image: imageValue,
        };

        const res = await post<Record<string, unknown>>(ENDPOINTS.classify.post, body);

        if (globals.json) {
          printJson(res);
          return;
        }

        const data = res.data as Record<string, unknown> | undefined;
        const probability = data?.ai_generated as number | undefined;

        if (probability !== undefined) {
          const pct = (probability * 100).toFixed(1);
          if (probability >= 0.5) {
            console.log(
              `${c.yellow}AI-generated${c.reset} (probability: ${c.bold}${pct}%${c.reset})`,
            );
          } else {
            console.log(
              `${c.green}Not AI-generated${c.reset} (probability: ${c.bold}${pct}%${c.reset})`,
            );
          }
        } else {
          // Fallback for unexpected response shape
          printJson(res);
        }
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
