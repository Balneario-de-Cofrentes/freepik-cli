import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { downloadGenerated } from '../lib/download.js';
import { ENDPOINTS } from '../lib/models.js';
import { info, error, printJson } from '../lib/output.js';
import type { MusicOptions, TaskCreateResponse } from '../types.js';

export function registerMusicCommand(program: Command): void {
  program
    .command('music')
    .description('Generate music from a text description')
    .argument('<prompt>', 'Text description of the music (e.g. "upbeat electronic track, 120bpm")')
    .option('-o, --output <path>', 'Output file path')
    .option('--no-download', 'Skip downloading, just return task info')
    .addHelpText('after', `
Examples:
  $ freepik music "upbeat electronic track, 120bpm, energetic" -o track.mp3
  $ freepik music "chill lofi beat, jazzy chords, vinyl crackle, 85bpm" -o lofi.mp3
  $ freepik music "epic orchestral, cinematic, building tension" -o epic.mp3
  $ freepik music "acoustic guitar, folk, warm and intimate" -o folk.mp3

Tip: Be specific about genre, tempo, instruments, and mood for best results.`)
    .action(async (prompt: string, opts: MusicOptions) => {
      try {
        info(`Generating music: "${prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt}"`);

        const body: Record<string, unknown> = {
          prompt,
        };

        const ep = ENDPOINTS.music;
        const res = await post<TaskCreateResponse>(ep.post, body);

        if (globals.json) {
          printJson(res);
          return;
        }

        const taskId = res.data.task_id;
        info(`Task created: ${taskId}`);

        if (!opts.download) {
          info(
            `Check status with: freepik status ${taskId} --endpoint ${ep.get}`,
          );
          return;
        }

        // Music generation can be slower
        const result = await pollTask(ep.get, taskId, {
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
