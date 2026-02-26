import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { HistoryEntry } from '../types.js';

const CONFIG_DIR = join(homedir(), '.config', 'freepik-cli');
const HISTORY_FILE = join(CONFIG_DIR, 'history.jsonl');

async function ensureDir(): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
}

/**
 * Append a history entry to the JSONL file.
 * Non-blocking, fire-and-forget. Never throws.
 */
export async function appendHistory(entry: HistoryEntry): Promise<void> {
  try {
    await ensureDir();
    await appendFile(HISTORY_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch {
    // Never fail the main command over history tracking
  }
}

/**
 * Read all history entries from the JSONL file.
 */
export async function readHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await readFile(HISTORY_FILE, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    return lines.map((line) => JSON.parse(line) as HistoryEntry);
  } catch {
    return [];
  }
}

export function getHistoryPath(): string {
  return HISTORY_FILE;
}
