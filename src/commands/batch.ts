import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { globals } from '../lib/globals.js';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { downloadGenerated } from '../lib/download.js';
import { getImageValue } from '../lib/image-input.js';
import { getGenerateModel, ENDPOINTS } from '../lib/models.js';
import { info, error, success, warn, printJson, c } from '../lib/output.js';
import type { BatchOptions, BatchManifestItem, TaskCreateResponse } from '../types.js';

async function loadManifest(filePath: string): Promise<BatchManifestItem[]> {
  const raw = await readFile(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  if (ext === '.json') {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Manifest must be a JSON array of items');
    }
    return parsed as BatchManifestItem[];
  }

  // For YAML-like files, attempt a simple JSON parse in case it's JSONL or formatted JSON
  // Otherwise, show an error directing the user to JSON
  throw new Error(
    `Unsupported manifest format "${ext}". Use a .json file. Example:\n` +
    '[\n  { "command": "generate", "prompt": "cat in space", "output": "cat.png" }\n]',
  );
}

async function executeItem(
  item: BatchManifestItem,
  index: number,
): Promise<{ index: number; success: boolean; output?: string; error?: string }> {
  const label = `[${index + 1}] ${item.command}`;

  try {
    switch (item.command) {
      case 'generate': {
        if (!item.prompt) throw new Error('Missing "prompt" field');
        const modelName = (item.model as string) ?? 'flux-2-turbo';
        const model = getGenerateModel(modelName);

        const body: Record<string, unknown> = { prompt: item.prompt };
        if (item.seed) body.seed = Number(item.seed);

        const res = await post<TaskCreateResponse>(model.post, body);
        const taskId = res.data.task_id;

        const result = await pollTask(model.get, taskId, { silent: true });
        const paths = await downloadGenerated(
          result.generated,
          item.output,
          false,
        );

        return { index, success: true, output: paths.join(', ') };
      }

      case 'upscale': {
        if (!item.image) throw new Error('Missing "image" field');
        const imageValue = await getImageValue(item.image as string);
        const scaleMap: Record<string, number> = { '2x': 2, '4x': 4, '8x': 8, '16x': 16 };
        const scale = scaleMap[(item.scale as string) ?? '2x'] ?? 2;

        const body: Record<string, unknown> = {
          image: imageValue,
          scale_factor: scale,
          creativity: 0,
          hdr: 0,
          resemblance: 0,
        };

        const ep = ENDPOINTS.upscale;
        const res = await post<TaskCreateResponse>(ep.post, body);
        const taskId = res.data.task_id;

        const result = await pollTask(ep.get, taskId, { silent: true });
        const paths = await downloadGenerated(
          result.generated,
          item.output,
          false,
        );

        return { index, success: true, output: paths.join(', ') };
      }

      case 'remove-bg': {
        if (!item.image) throw new Error('Missing "image" field');
        const imageValue = await getImageValue(item.image as string);
        const body: Record<string, unknown> = { image: imageValue };

        const res = await post<Record<string, unknown>>(ENDPOINTS.removeBg.post, body);
        const data = res.data as Record<string, unknown> | undefined;

        if (data?.image_url) {
          const { downloadFile } = await import('../lib/download.js');
          const path = await downloadFile(
            data.image_url as string,
            item.output,
            undefined,
            false,
          );
          return { index, success: true, output: path };
        }

        return { index, success: true, output: 'completed (check response)' };
      }

      default:
        return { index, success: false, error: `Unknown command "${item.command}"` };
    }
  } catch (err) {
    return { index, success: false, error: `${label}: ${(err as Error).message}` };
  }
}

export function registerBatchCommand(program: Command): void {
  program
    .command('batch')
    .description('Execute multiple operations from a JSON manifest')
    .argument('<manifest>', 'Path to JSON manifest file')
    .option('--concurrency <n>', 'Max parallel operations', '3')
    .action(async (manifestPath: string, opts: BatchOptions) => {
      try {
        const items = await loadManifest(manifestPath);
        const concurrency = Math.max(1, Number(opts.concurrency ?? 3));

        info(`Loaded ${items.length} items from manifest (concurrency: ${concurrency})`);

        if (globals.json) {
          // In JSON mode, just run and output results
          const results = [];
          for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            const batchResults = await Promise.allSettled(
              batch.map((item, j) => executeItem(item, i + j)),
            );
            for (const r of batchResults) {
              results.push(r.status === 'fulfilled' ? r.value : { success: false, error: String(r.reason) });
            }
          }
          printJson(results);
          return;
        }

        const allResults: Awaited<ReturnType<typeof executeItem>>[] = [];
        const startTime = Date.now();

        // Process in batches with concurrency limit
        for (let i = 0; i < items.length; i += concurrency) {
          const batch = items.slice(i, i + concurrency);
          const batchNum = Math.floor(i / concurrency) + 1;
          const totalBatches = Math.ceil(items.length / concurrency);
          info(`Processing batch ${batchNum}/${totalBatches}...`);

          const batchResults = await Promise.allSettled(
            batch.map((item, j) => executeItem(item, i + j)),
          );

          for (const r of batchResults) {
            if (r.status === 'fulfilled') {
              allResults.push(r.value);
              if (r.value.success) {
                success(`[${r.value.index + 1}] ${items[r.value.index].command} -> ${r.value.output}`);
              } else {
                warn(`[${r.value.index + 1}] Failed: ${r.value.error}`);
              }
            } else {
              allResults.push({ index: -1, success: false, error: String(r.reason) });
              warn(`Unexpected error: ${r.reason}`);
            }
          }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const succeeded = allResults.filter((r) => r.success).length;
        const failed = allResults.filter((r) => !r.success).length;

        console.log();
        console.log(`${c.bold}Batch complete${c.reset} in ${elapsed}s`);
        console.log(`  ${c.green}${succeeded} succeeded${c.reset}  ${failed > 0 ? c.red + failed + ' failed' + c.reset : ''}`);
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
