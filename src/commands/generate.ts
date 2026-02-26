import { Command } from 'commander';
import { extname } from 'node:path';
import { post } from '../lib/api.js';
import { pollTask } from '../lib/poll.js';
import { downloadGenerated } from '../lib/download.js';
import { getGenerateModel, listGenerateModels } from '../lib/models.js';
import { globals } from '../lib/globals.js';
import { openFile } from '../lib/open.js';
import { expandTemplate } from '../lib/templates.js';
import { appendHistory } from '../lib/history.js';
import { info, error, warn, printJson, c } from '../lib/output.js';
import { loadConfig } from '../lib/config.js';
import type { GenerateOptions, TaskCreateResponse } from '../types.js';

// ── Smart model selection ──────────────────────────────────────────
const SMART_RULES: Array<{ keywords: string[]; model: string; reason: string }> = [
  {
    keywords: ['photo', 'portrait', 'realistic', 'person', 'face', 'headshot', 'human'],
    model: 'mystic',
    reason: 'portrait, realistic',
  },
  {
    keywords: ['logo', 'icon', 'minimal', 'flat', 'simple', 'badge', 'emblem'],
    model: 'hyperflux',
    reason: 'logo, minimal (fast)',
  },
  {
    keywords: ['art', 'illustration', 'painting', 'watercolor', 'sketch', 'artistic', 'anime'],
    model: 'flux-dev',
    reason: 'art, illustration (supports styling)',
  },
  {
    keywords: ['banner', 'poster', 'advertisement', 'commercial', 'marketing', 'ad'],
    model: 'flux-2-pro',
    reason: 'commercial, professional',
  },
];

function selectSmartModel(prompt: string): { model: string; reason: string } {
  const lower = prompt.toLowerCase();
  for (const rule of SMART_RULES) {
    const matched = rule.keywords.filter((kw) => lower.includes(kw));
    if (matched.length > 0) {
      return { model: rule.model, reason: `${matched.join(', ')}` };
    }
  }
  return { model: 'flux-2-turbo', reason: 'default fallback' };
}

// ── Name template expansion ────────────────────────────────────────
function expandNameTemplate(
  template: string,
  vars: { prompt: string; model: string; seed: number; ext: string; n: number; timestamp: number },
): string {
  const slugified = vars.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

  return template
    .replace(/\{prompt\}/g, slugified)
    .replace(/\{model\}/g, vars.model)
    .replace(/\{seed\}/g, String(vars.seed))
    .replace(/\{ext\}/g, vars.ext)
    .replace(/\{n\}/g, String(vars.n))
    .replace(/\{timestamp\}/g, String(vars.timestamp));
}

// ── Body builders ──────────────────────────────────────────────────
function buildMysticBody(prompt: string, opts: GenerateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = { prompt };

  if (opts.resolution) body.resolution = opts.resolution;
  if (opts.aspectRatio) body.aspect_ratio = opts.aspectRatio;
  if (opts.style) body.styling = { style: opts.style };
  if (opts.creativeDetailing) body.creative_detailing = Number(opts.creativeDetailing);
  if (opts.engine) body.engine = opts.engine;
  if (opts.seed) body.seed = Number(opts.seed);
  if (opts.webhook) body.webhook = opts.webhook;

  return body;
}

function buildFluxBody(prompt: string, opts: GenerateOptions, modelName: string): Record<string, unknown> {
  const body: Record<string, unknown> = { prompt };

  if (opts.width) body.width = Number(opts.width);
  if (opts.height) body.height = Number(opts.height);
  if (opts.guidance) body.guidance_scale = Number(opts.guidance);
  if (opts.format) body.output_format = opts.format;
  if (opts.seed) body.seed = Number(opts.seed);
  if (opts.webhook) body.webhook = opts.webhook;

  // Flux Dev extras
  if (modelName === 'flux-dev') {
    if (opts.aspectRatio) body.aspect_ratio = opts.aspectRatio;
    if (opts.colorEffect) body.color_effect = opts.colorEffect;
    if (opts.framing) body.framing = opts.framing;
    if (opts.lighting) body.lighting = opts.lighting;
  }

  return body;
}

// ── Single generation run ──────────────────────────────────────────
async function runSingleGeneration(
  prompt: string,
  opts: GenerateOptions,
  modelName: string,
  seed?: number,
  outputPath?: string,
): Promise<string[]> {
  const model = getGenerateModel(modelName);

  const effectiveOpts = { ...opts };
  if (seed !== undefined) {
    effectiveOpts.seed = String(seed);
  }

  const body =
    modelName === 'mystic'
      ? buildMysticBody(prompt, effectiveOpts)
      : buildFluxBody(prompt, effectiveOpts, modelName);

  const startTime = Date.now();
  const res = await post<TaskCreateResponse>(model.post, body);

  const taskId = res.data.task_id;

  // Handle cached results
  if (res.data.status === 'COMPLETED') {
    const rawGenerated = (res.data as Record<string, unknown>).generated as
      | Array<string | { url: string; content_type?: string }>
      | undefined;
    if (rawGenerated && opts.download !== false) {
      const generated = rawGenerated.map((item) =>
        typeof item === 'string' ? { url: item } : item,
      );
      const paths = await downloadGenerated(generated, outputPath, globals.verbose);

      // Log history (non-blocking)
      appendHistory({
        timestamp: new Date().toISOString(),
        command: 'generate',
        model: modelName,
        prompt,
        seed: seed ?? (opts.seed ? Number(opts.seed) : undefined),
        taskId,
        outputPath: paths[0],
        elapsed: Date.now() - startTime,
      }).catch(() => {});

      return paths;
    }
    return [];
  }

  if (opts.download === false) {
    return [];
  }

  // Poll until done
  const result = await pollTask(model.get, taskId, {
    silent: globals.json,
  });

  const paths = await downloadGenerated(result.generated, outputPath, globals.verbose);

  // Log history (non-blocking)
  appendHistory({
    timestamp: new Date().toISOString(),
    command: 'generate',
    model: modelName,
    prompt,
    seed: seed ?? (opts.seed ? Number(opts.seed) : undefined),
    taskId,
    outputPath: paths[0],
    elapsed: Date.now() - startTime,
  }).catch(() => {});

  return paths;
}

// ── Command registration ───────────────────────────────────────────
export function registerGenerateCommand(program: Command): void {
  const models = listGenerateModels();

  program
    .command('generate')
    .description('Generate images from text prompts')
    .argument('[prompt]', 'Text prompt (optional when using --template)')
    .option('-m, --model <model>', `Model to use (${models.join(', ')})`, 'flux-2-turbo')
    .option('-o, --output <path>', 'Output file path')
    .option('-s, --seed <number>', 'Random seed for reproducibility')
    .option('--webhook <url>', 'Webhook URL for completion notification')
    .option('--no-download', 'Skip downloading, just return task info')
    .option('--open', 'Open the file after downloading')
    .option('-n, --count <n>', 'Generate N images in parallel (different seeds)')
    .option('--smart', 'Auto-select the best model based on prompt analysis')
    .option('--template <name>', 'Use a prompt template (see: freepik templates)')
    .option('--vars <pairs>', 'Template variables as key=val,key2=val2')
    .option('--name-template <tpl>', 'Output filename template ({prompt}, {model}, {seed}, {timestamp}, {ext}, {n})')
    .option(
      '--resolution <res>',
      'Resolution for Mystic (1k, 2k, 4k)',
    )
    .option(
      '--aspect-ratio <ratio>',
      'Aspect ratio (square_1_1, classic_4_3, traditional_3_4, widescreen_16_9, social_story_9_16, standard_3_2, portrait_2_3, horizontal_2_1, vertical_1_2, social_post_4_5, cinematic_21_9)',
    )
    .option(
      '--style <style>',
      'Style for Mystic (zen, flexible, fluid, realism, super_real, editorial_portraits)',
    )
    .option('--creative-detailing <n>', 'Creative detailing 0-100 for Mystic')
    .option(
      '--engine <engine>',
      'Engine (automatic, magnific_illusio, magnific_sharpy, magnific_sparkle)',
    )
    .option('--width <px>', 'Width in pixels 512-2048 (Flux models)')
    .option('--height <px>', 'Height in pixels 512-2048 (Flux models)')
    .option('--guidance <n>', 'Guidance scale 1.0-20.0 (Flux models)')
    .option('--format <fmt>', 'Output format png/jpeg (Flux models)')
    .option(
      '--color-effect <effect>',
      'Color effect for Flux Dev (softhue, b&w, goldglow, vibrant, coldneon)',
    )
    .option(
      '--framing <framing>',
      'Framing for Flux Dev (portrait, lowangle, midshot, wideshot, tiltshot, aerial)',
    )
    .option(
      '--lighting <lighting>',
      'Lighting for Flux Dev (iridescent, dramatic, goldenhour, longexposure, indorlight, flash, neon)',
    )
    .addHelpText('after', `
Examples:
  $ freepik generate "a cat in space" -o cat.png
  $ freepik generate "professional headshot" --smart -o photo.png
  $ freepik generate "sunset landscape" -m mystic --resolution 4k -o sunset.png
  $ freepik generate "logo concept" -m hyperflux -o logo.png
  $ freepik generate "abstract art" -m flux-dev --color-effect vibrant --lighting neon -o art.png
  $ freepik generate "product mockup" --count 5 -o "product-{n}.png"
  $ freepik generate --template product-photo --vars "product=headphones,background=white" -o headphones.png
  $ freepik generate "hero banner" --aspect-ratio widescreen_16_9 -o banner.png
  $ freepik generate "icon set" --json | jq '.data.task_id'    # Agent: get task ID only
  $ freepik generate "test" --no-download                       # Agent: skip download, get task info

Free models (no cost):  flux-2-turbo (default), flux-2-klein, hyperflux, flux-dev, seedream-4, seedream-4.5
Premium models:         mystic (best quality), flux-2-pro, flux-kontext, flux-pro-1.1, runway`)
    .action(async (prompt: string | undefined, opts: GenerateOptions) => {
      try {
        // Load default model from config if user didn't explicitly pass -m/--model
        if (!process.argv.includes('-m') && !process.argv.includes('--model')) {
          const config = await loadConfig();
          if (config.defaultModel) {
            opts.model = config.defaultModel;
          }
        }

        let effectivePrompt = prompt ?? '';

        // Template expansion
        if (opts.template) {
          const { prompt: expanded, warnings } = expandTemplate(opts.template, opts.vars ?? '');
          effectivePrompt = expanded;
          for (const w of warnings) {
            warn(w);
          }
          info(`Template "${opts.template}" expanded to: "${effectivePrompt.slice(0, 80)}${effectivePrompt.length > 80 ? '...' : ''}"`);
        }

        if (!effectivePrompt) {
          error('A prompt is required. Provide one as argument or use --template.');
          process.exit(1);
        }

        // Smart model selection
        let modelName = opts.model;
        if (opts.smart) {
          const { model, reason } = selectSmartModel(effectivePrompt);
          modelName = model;
          info(`Smart selection: ${c.bold}${model}${c.reset} (detected: ${reason})`);
        }

        const count = opts.count ? Math.max(1, Math.min(10, Number(opts.count))) : 1;

        info(
          `Generating${count > 1 ? ` ${count} images` : ''} with ${c.bold}${modelName}${c.reset}: "${effectivePrompt.length > 60 ? effectivePrompt.slice(0, 60) + '...' : effectivePrompt}"`,
        );

        // ── Single generation ────────────────────────────────────
        if (count === 1) {
          if (globals.json) {
            // For JSON mode, do the manual post for raw response
            const model = getGenerateModel(modelName);
            const body =
              modelName === 'mystic'
                ? buildMysticBody(effectivePrompt, opts)
                : buildFluxBody(effectivePrompt, opts, modelName);
            const res = await post<TaskCreateResponse>(model.post, body);
            printJson(res);
            return;
          }

          const paths = await runSingleGeneration(
            effectivePrompt,
            opts,
            modelName,
            opts.seed ? Number(opts.seed) : undefined,
            opts.output,
          );
          if (opts.open && paths.length > 0) {
            openFile(paths[0]);
          }
          return;
        }

        // ── Parallel generation (--count N) ──────────────────────
        const seeds = Array.from({ length: count }, () =>
          Math.floor(Math.random() * 2_147_483_647),
        );

        // Build output paths for each
        const outputPaths: (string | undefined)[] = [];
        if (opts.nameTemplate) {
          const ext = opts.output ? extname(opts.output).slice(1) || 'png' : 'png';
          const ts = Date.now();
          for (let i = 0; i < count; i++) {
            outputPaths.push(
              expandNameTemplate(opts.nameTemplate, {
                prompt: effectivePrompt,
                model: modelName,
                seed: seeds[i],
                ext,
                n: i + 1,
                timestamp: ts,
              }),
            );
          }
        } else if (opts.output) {
          const ext = extname(opts.output);
          const base = opts.output.slice(0, opts.output.length - ext.length);
          for (let i = 0; i < count; i++) {
            outputPaths.push(`${base}-${i + 1}${ext}`);
          }
        } else {
          for (let i = 0; i < count; i++) {
            outputPaths.push(undefined);
          }
        }

        info(`Spawning ${count} parallel generations with seeds: ${seeds.join(', ')}`);

        const results = await Promise.allSettled(
          seeds.map((seed, i) =>
            runSingleGeneration(effectivePrompt, opts, modelName, seed, outputPaths[i]),
          ),
        );

        if (globals.json) {
          const jsonResults = results.map((r, i) => ({
            index: i + 1,
            seed: seeds[i],
            status: r.status,
            paths: r.status === 'fulfilled' ? r.value : [],
            error: r.status === 'rejected' ? String(r.reason) : undefined,
          }));
          printJson(jsonResults);
          return;
        }

        const allPaths: string[] = [];
        let succeeded = 0;
        let failed = 0;

        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          if (r.status === 'fulfilled' && r.value.length > 0) {
            succeeded++;
            allPaths.push(...r.value);
          } else {
            failed++;
            const reason = r.status === 'rejected' ? (r.reason as Error).message : 'no output';
            warn(`Generation ${i + 1} (seed ${seeds[i]}): ${reason}`);
          }
        }

        console.log();
        info(`Batch complete: ${succeeded} succeeded, ${failed} failed`);

        if (opts.open && allPaths.length > 0) {
          openFile(allPaths[0]);
        }
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
