import { Command } from 'commander';
import { execSync, execFileSync } from 'node:child_process';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { downloadFile } from '../lib/download.js';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { openFile } from '../lib/open.js';
import { info, error, success, warn, printJson } from '../lib/output.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getOutputDir } from '../lib/config.js';
import type { SimpleImageOptions } from '../types.js';

interface RemoveBgOptions extends SimpleImageOptions {
  local?: boolean;
  open?: boolean;
}

function isRembgInstalled(): boolean {
  try {
    execSync('which rembg', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function registerRemoveBgCommand(program: Command): void {
  program
    .command('remove-bg')
    .description('Remove background from an image')
    .argument('<image>', 'Input image (local file path or URL)')
    .option('-o, --output <path>', 'Output file path')
    .option('--local', 'Use local rembg instead of API (free, offline)')
    .option('--open', 'Open the file after processing')
    .addHelpText('after', `
Examples:
  $ freepik remove-bg product.jpg -o product-clean.png
  $ freepik remove-bg portrait.jpg -o portrait-nobg.png --open
  $ freepik remove-bg https://example.com/photo.jpg -o clean.png    # Works with URLs
  $ freepik remove-bg photo.jpg --local -o clean.png                # Free offline mode (requires rembg)`)
    .action(async (image: string, opts: RemoveBgOptions) => {
      try {
        // ── Local mode (rembg) ─────────────────────────────────
        if (opts.local) {
          if (!isRembgInstalled()) {
            error('rembg not found. Install with: pip install rembg[cli]');
            process.exit(1);
          }

          const outputPath =
            opts.output ?? join(await getOutputDir(), `freepik-nobg-${Date.now()}.png`);

          info('Removing background locally with rembg...');

          try {
            execFileSync('rembg', ['i', image, outputPath], { stdio: 'pipe' });
            success(`Saved to ${outputPath}`);

            if (opts.open) {
              openFile(outputPath);
            }
          } catch (err) {
            error(`rembg failed: ${(err as Error).message}`);
            process.exit(1);
          }
          return;
        }

        // ── API mode (default) ─────────────────────────────────
        info(`Removing background...`);

        const imageValue = await getImageValue(image);
        const body: Record<string, unknown> = {
          image: imageValue,
        };

        const res = await post<Record<string, unknown>>(ENDPOINTS.removeBg.post, body);

        if (globals.json) {
          printJson(res);
          return;
        }

        const data = res.data as Record<string, unknown> | undefined;
        let savedPath: string | undefined;

        // The API may return an image URL or base64 directly
        if (data?.image_url) {
          const outputPath =
            opts.output ?? join(await getOutputDir(), `freepik-nobg-${Date.now()}.png`);
          await downloadFile(data.image_url as string, outputPath, undefined, globals.verbose);
          success(`Saved to ${outputPath}`);
          savedPath = outputPath;
        } else if (data?.base64) {
          const outputPath =
            opts.output ?? join(await getOutputDir(), `freepik-nobg-${Date.now()}.png`);
          const b64 = (data.base64 as string).replace(/^data:image\/\w+;base64,/, '');
          await writeFile(outputPath, Buffer.from(b64, 'base64'));
          success(`Saved to ${outputPath}`);
          savedPath = outputPath;
        } else {
          // Some responses include generated array, attempt to find URL
          const generated = (data as Record<string, unknown>)?.generated as
            | Array<{ url: string }>
            | undefined;
          if (generated?.[0]?.url) {
            const outputPath =
              opts.output ?? join(await getOutputDir(), `freepik-nobg-${Date.now()}.png`);
            await downloadFile(generated[0].url, outputPath, undefined, globals.verbose);
            success(`Saved to ${outputPath}`);
            savedPath = outputPath;
          } else {
            // Fallback: print the raw response
            printJson(res);
          }
        }

        if (opts.open && savedPath) {
          openFile(savedPath);
        }
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
