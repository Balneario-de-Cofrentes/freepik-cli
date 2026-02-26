import { Command } from 'commander';
import { getImageValue } from '../lib/image-input.js';
import { getVideoModel, listVideoModels } from '../lib/models.js';
import { runAsyncTask } from '../lib/run-task.js';
import { error, c } from '../lib/output.js';
import type { VideoOptions } from '../types.js';

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
    .addHelpText('after', `
Examples:
  $ freepik video --prompt "waves crashing on beach at sunset" -o ocean.mp4
  $ freepik video --image photo.jpg --prompt "slow zoom in" -o animated.mp4
  $ freepik video --image scene.png --model kling-2.6-pro -o cinematic.mp4
  $ freepik video --prompt "timelapse of flowers blooming" --model wan-2.5-t2v -o flowers.mp4
  $ freepik video --image hero.jpg --json                       # Agent: get raw JSON response

Models: kling-2.1-pro, kling-2.5-pro, kling-2.6-pro (image-to-video) | wan-2.5-t2v (text-to-video) | hailuo-02
Note: Video generation takes 1-5 minutes. The CLI polls automatically.`)
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

        const body: Record<string, unknown> = {};

        if (opts.image) {
          body.image = await getImageValue(opts.image);
        }
        if (opts.prompt) {
          body.prompt = opts.prompt;
        }

        await runAsyncTask(model, body, {
          download: opts.download,
          output: opts.output,
          maxWait: 600_000,
          label: `Generating video with ${c.bold}${modelName}${c.reset}...`,
        });
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
