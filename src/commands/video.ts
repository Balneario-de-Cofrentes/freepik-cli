import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { downloadGenerated } from '../lib/download.js';
import { getImageValue } from '../lib/image-input.js';
import { getVideoModel, listVideoModels } from '../lib/models.js';
import { info, error, printJson, c } from '../lib/output.js';
import type { VideoOptions, TaskCreateResponse } from '../types.js';

export function registerVideoCommand(program: Command): void {
  const models = listVideoModels();

  program
    .command('video')
    .description('Generate a video from an image or text prompt')
    .option('-m, --model <model>', `Model (${models.join(', ')})`, 'kling-2.6-pro')
    .option('--image <path>', 'Input image for image-to-video models (local file or URL)')
    .option('--prompt <text>', 'Text prompt for the video')
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .action(async (opts: VideoOptions) => {
      try {
        const modelName = opts.model;
        const model = getVideoModel(modelName);

        // Validate input requirements
        if (model.category === 'image-to-video' && !opts.image) {
          throw new Error(
            `Model "${modelName}" is image-to-video and requires --image. For text-to-video, use --model wan-2.5-t2v`,
          );
        }
        if (model.category === 'text-to-video' && !opts.prompt) {
          throw new Error(
            `Model "${modelName}" is text-to-video and requires --prompt`,
          );
        }

        info(`Generating video with ${c.bold}${modelName}${c.reset}...`);

        const body: Record<string, unknown> = {};

        if (opts.image) {
          body.image = await getImageValue(opts.image);
        }
        if (opts.prompt) {
          body.prompt = opts.prompt;
        }

        const res = await post<TaskCreateResponse>(model.post, body);

        if (globals.json) {
          printJson(res);
          return;
        }

        const taskId = res.data.task_id;
        info(`Task created: ${taskId}`);

        if (!opts.download) {
          info(
            `Check status with: freepik status ${taskId} --endpoint ${model.get}`,
          );
          return;
        }

        // Videos take longer, increase timeout to 10 min
        const result = await pollTask(model.get, taskId, {
          maxWait: 600_000,
          silent: globals.json,
        });

        if (globals.json) {
          printJson(result.raw);
          return;
        }

        await downloadGenerated(result.generated, opts.output, globals.verbose);
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
