import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { get } from '../lib/api.js';
import { downloadGenerated } from '../lib/download.js';
import { info, error, success, warn, printJson, c } from '../lib/output.js';
import type { StatusOptions, TaskStatusResponse } from '../types.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Check the status of an async task')
    .argument('<task-id>', 'Task ID to check')
    .requiredOption(
      '--endpoint <path>',
      'API endpoint path (e.g. /v1/ai/text-to-image/flux-2-turbo)',
    )
    .option('-o, --output <path>', 'Download output to this path if completed')
    .action(async (taskId: string, opts: StatusOptions & { output?: string }) => {
      try {
        info(`Checking task ${taskId}...`);

        const res = await get<TaskStatusResponse>(`${opts.endpoint}/${taskId}`);

        if (globals.json) {
          printJson(res);
          return;
        }

        const status = res.data.status;
        const rawGenerated = res.data.generated ?? [];
        // Normalize: API may return string[] or {url,content_type}[]
        const generated = rawGenerated.map((item) =>
          typeof item === 'string' ? { url: item } : item,
        );

        switch (status) {
          case 'COMPLETED':
            success(`Task completed (${generated.length} file${generated.length !== 1 ? 's' : ''})`);
            for (const item of generated) {
              console.log(`  ${c.dim}URL:${c.reset} ${item.url}`);
            }
            // Offer to download if output is specified
            if (opts.output && generated.length > 0) {
              await downloadGenerated(generated, opts.output, globals.verbose);
            }
            break;

          case 'FAILED':
            error(`Task failed`);
            printJson(res.data);
            break;

          case 'PENDING':
          case 'PROCESSING':
            warn(`Task is ${status.toLowerCase()}`);
            info(`Run this command again to check, or wait for webhook notification`);
            break;

          default:
            info(`Task status: ${status}`);
            printJson(res.data);
        }
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
