import { Command } from 'commander';
import { ENDPOINTS } from '../lib/models.js';
import { runAsyncTask } from '../lib/run-task.js';
import { error } from '../lib/output.js';
import type { MusicOptions } from '../types.js';

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
        const body: Record<string, unknown> = {
          prompt,
        };

        await runAsyncTask(ENDPOINTS.music, body, {
          download: opts.download,
          output: opts.output,
          maxWait: 600_000,
          label: `Generating music: "${prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt}"`,
        });
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
