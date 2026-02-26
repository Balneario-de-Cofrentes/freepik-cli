import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { CliConfig } from '../types.js';

export const CONFIG_DIR = join(homedir(), '.config', 'freepik-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export async function ensureConfigDir(): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
}

export async function loadConfig(): Promise<CliConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as CliConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(config: CliConfig): Promise<void> {
  await ensureConfigDir();
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export async function getApiKey(): Promise<string> {
  // Environment variable takes precedence
  const envKey = process.env.FREEPIK_API_KEY;
  if (envKey) return envKey;

  const config = await loadConfig();
  if (config.apiKey) return config.apiKey;

  throw new Error(
    'No API key found. Set FREEPIK_API_KEY environment variable or run: freepik config set-key <key>',
  );
}

export async function getOutputDir(): Promise<string> {
  const config = await loadConfig();
  return config.outputDir ?? '.';
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '...' + key.slice(-4);
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

const REPO_URL = 'https://github.com/Balneario-de-Cofrentes/freepik-cli';
const STAR_NUDGE_AFTER = 5; // Show after N successful generations

/**
 * Track a successful generation and maybe show a one-time star nudge.
 * Non-blocking, fire-and-forget. Never interrupts the user's workflow.
 */
export async function trackGeneration(): Promise<void> {
  try {
    const config = await loadConfig();
    config.generations = (config.generations ?? 0) + 1;

    if (!config.starNudgeShown && config.generations >= STAR_NUDGE_AFTER) {
      config.starNudgeShown = true;
      await saveConfig(config);
      // Subtle one-liner, no prompt, no blocking
      const dim = '\x1b[2m';
      const cyan = '\x1b[36m';
      const reset = '\x1b[0m';
      console.log(
        `${dim}Enjoying freepik-cli? Star us on GitHub: ${cyan}${REPO_URL}${reset}`,
      );
      return;
    }

    await saveConfig(config);
  } catch {
    // Never fail the user's command over a nudge
  }
}
