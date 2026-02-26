import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { info, error, success, printJson, c } from '../lib/output.js';
import type { DescribeOptions, TaskCreateResponse } from '../types.js';

export function registerDescribeCommand(program: Command): void {
  program
    .command('describe')
    .description('Convert an image to a text prompt description')
    .argument('<image>', 'Input image (local file path or URL)')
    .action(async (image: string, _opts: DescribeOptions) => {
      try {
        info('Analyzing image to generate prompt...');

        const imageValue = await getImageValue(image);
        const body: Record<string, unknown> = {
          image: imageValue,
        };

        const ep = ENDPOINTS.describe;
        const res = await post<TaskCreateResponse>(ep.post, body);

        if (globals.json) {
          printJson(res);
          return;
        }

        const taskId = res.data.task_id;

        // Check if result is already available (some endpoints return inline)
        const inlinePrompt = (res.data as Record<string, unknown>).prompt as string | undefined;
        if (inlinePrompt) {
          success('Generated prompt:');
          console.log();
          console.log(`  ${c.cyan}${inlinePrompt}${c.reset}`);
          console.log();
          return;
        }

        info(`Task created: ${taskId}`);

        // Poll until done
        const result = await pollTask(ep.get, taskId, { silent: globals.json });

        if (globals.json) {
          printJson(result.raw);
          return;
        }

        // Extract the prompt from the result
        const resultData = result.raw.data as Record<string, unknown>;
        const prompt =
          (resultData.prompt as string) ??
          (resultData.description as string) ??
          (resultData.text as string);

        if (prompt) {
          success('Generated prompt:');
          console.log();
          console.log(`  ${c.cyan}${prompt}${c.reset}`);
          console.log();
        } else {
          // If the result is in generated array, it might be text
          const generated = result.generated;
          if (generated.length > 0) {
            for (const item of generated) {
              const text = (item as Record<string, unknown>).text as string | undefined;
              if (text) {
                console.log(`  ${c.cyan}${text}${c.reset}`);
              } else {
                console.log(`  ${c.dim}${item.url}${c.reset}`);
              }
            }
          } else {
            printJson(result.raw);
          }
        }
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
