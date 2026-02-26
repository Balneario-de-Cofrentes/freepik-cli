import { Command } from 'commander';
import { loadConfig } from '../lib/config.js';
import { openFile, openUrl } from '../lib/open.js';
import { info, error, c } from '../lib/output.js';
import type { OpenOptions } from '../types.js';

export function registerOpenCommand(program: Command): void {
  program
    .command('open')
    .description('Open the last generated file or a specific file')
    .argument('[file]', 'File path or URL to open')
    .option('--url', 'Open as URL in browser instead of local file')
    .action(async (file: string | undefined, opts: OpenOptions) => {
      try {
        if (file) {
          if (opts.url || file.startsWith('http://') || file.startsWith('https://')) {
            info(`Opening URL: ${c.cyan}${file}${c.reset}`);
            openUrl(file);
          } else {
            info(`Opening: ${file}`);
            openFile(file);
          }
          return;
        }

        // No file specified, open the last generated file
        const config = await loadConfig();
        if (!config.lastOutputPath) {
          error('No recent file found. Generate something first, or specify a file path.');
          process.exit(1);
        }

        info(`Opening last generated: ${config.lastOutputPath}`);
        openFile(config.lastOutputPath);
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
