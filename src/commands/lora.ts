import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { get, post } from '../lib/api.js';
import { getImageValue } from '../lib/image-input.js';
import { ENDPOINTS } from '../lib/models.js';
import { info, error, success, printJson, c } from '../lib/output.js';
import type { LoraListOptions, LoraTrainOptions } from '../types.js';

interface LoraItem {
  id: string;
  name: string;
  category?: string;
  type?: string;
  status?: string;
  [key: string]: unknown;
}

interface LoraListResponse {
  data: LoraItem[];
  [key: string]: unknown;
}

export function registerLoraCommand(program: Command): void {
  const loraCmd = program
    .command('lora')
    .description('Manage LoRA models (list, train)')
    .addHelpText('after', `
Examples:
  $ freepik lora list
  $ freepik lora train-character "my-character" --images img1.jpg,img2.jpg,img3.jpg
  $ freepik lora train-style "my-style" --images style1.jpg,style2.jpg`);

  // ── lora list ──────────────────────────────────────────────────────
  loraCmd
    .command('list')
    .description('List available LoRA models')
    .action(async (_opts: LoraListOptions) => {
      try {
        info('Fetching LoRA models...');

        const res = await get<LoraListResponse>(ENDPOINTS.loras.list);

        if (globals.json) {
          printJson(res);
          return;
        }

        const loras = res.data ?? [];

        if (loras.length === 0) {
          info('No LoRA models found. Train one with: freepik lora train-character <name>');
          return;
        }

        console.log();
        console.log(`${c.bold}LoRA Models (${loras.length})${c.reset}`);
        console.log();

        const idW = 12;
        const nameW = 24;
        const catW = 14;
        const typeW = 12;
        const statusW = 12;

        console.log(
          `  ${c.dim}${'ID'.padEnd(idW)}  ${'Name'.padEnd(nameW)}  ${'Category'.padEnd(catW)}  ${'Type'.padEnd(typeW)}  ${'Status'.padEnd(statusW)}${c.reset}`,
        );
        console.log(
          `  ${c.dim}${'-'.repeat(idW)}  ${'-'.repeat(nameW)}  ${'-'.repeat(catW)}  ${'-'.repeat(typeW)}  ${'-'.repeat(statusW)}${c.reset}`,
        );

        for (const lora of loras) {
          const id = String(lora.id).slice(0, idW).padEnd(idW);
          const name = (lora.name ?? '').slice(0, nameW).padEnd(nameW);
          const category = (lora.category ?? '-').slice(0, catW).padEnd(catW);
          const type = (lora.type ?? '-').slice(0, typeW).padEnd(typeW);
          const status = (lora.status ?? '-').slice(0, statusW).padEnd(statusW);
          console.log(`  ${id}  ${name}  ${category}  ${type}  ${status}`);
        }

        console.log();
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });

  // ── lora train-character ───────────────────────────────────────────
  loraCmd
    .command('train-character')
    .description('Train a character LoRA model')
    .argument('<name>', 'Name for the LoRA model')
    .requiredOption('--images <paths>', 'Comma-separated image paths/URLs (8-20 required)')
    .option('--quality <q>', 'Training quality (high, ultra)', 'high')
    .option('--gender <g>', 'Gender (male, female, neutral, custom)', 'neutral')
    .option('--description <text>', 'Description of the character')
    .action(async (name: string, opts: LoraTrainOptions) => {
      try {
        const imagePaths = opts.images.split(',').map((s) => s.trim()).filter(Boolean);

        if (imagePaths.length < 8 || imagePaths.length > 20) {
          throw new Error(
            `Character LoRA requires 8-20 images, got ${imagePaths.length}`,
          );
        }

        info(`Training character LoRA "${name}" with ${imagePaths.length} images...`);

        // Process all images
        const images: string[] = [];
        for (const imgPath of imagePaths) {
          images.push(await getImageValue(imgPath));
        }

        const body: Record<string, unknown> = {
          name,
          images,
          quality: opts.quality ?? 'high',
          gender: opts.gender ?? 'neutral',
        };
        if (opts.description) body.description = opts.description;

        const res = await post<Record<string, unknown>>(
          ENDPOINTS.loras.trainCharacter,
          body,
        );

        if (globals.json) {
          printJson(res);
          return;
        }

        success(`LoRA training started for "${name}"`);
        const data = res.data as Record<string, unknown> | undefined;
        if (data?.id) {
          info(`LoRA ID: ${data.id}`);
        }
        info('Training may take several minutes. Check status with: freepik lora list');
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });

  // ── lora train-style ───────────────────────────────────────────────
  loraCmd
    .command('train-style')
    .description('Train a style LoRA model')
    .argument('<name>', 'Name for the LoRA model')
    .requiredOption('--images <paths>', 'Comma-separated image paths/URLs (8-20 required)')
    .option('--quality <q>', 'Training quality (high, ultra)', 'high')
    .option('--description <text>', 'Description of the style')
    .action(async (name: string, opts: LoraTrainOptions) => {
      try {
        const imagePaths = opts.images.split(',').map((s) => s.trim()).filter(Boolean);

        if (imagePaths.length < 8 || imagePaths.length > 20) {
          throw new Error(
            `Style LoRA requires 8-20 images, got ${imagePaths.length}`,
          );
        }

        info(`Training style LoRA "${name}" with ${imagePaths.length} images...`);

        const images: string[] = [];
        for (const imgPath of imagePaths) {
          images.push(await getImageValue(imgPath));
        }

        const body: Record<string, unknown> = {
          name,
          images,
          quality: opts.quality ?? 'high',
        };
        if (opts.description) body.description = opts.description;

        const res = await post<Record<string, unknown>>(
          ENDPOINTS.loras.trainStyle,
          body,
        );

        if (globals.json) {
          printJson(res);
          return;
        }

        success(`Style LoRA training started for "${name}"`);
        const data = res.data as Record<string, unknown> | undefined;
        if (data?.id) {
          info(`LoRA ID: ${data.id}`);
        }
        info('Training may take several minutes. Check status with: freepik lora list');
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
