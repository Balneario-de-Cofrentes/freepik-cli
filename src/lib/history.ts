import { appendFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONFIG_DIR, ensureConfigDir } from './config.js';
import type { HistoryEntry } from '../types.js';

const HISTORY_FILE = join(CONFIG_DIR, 'history.jsonl');

/**
 * Append a history entry to the JSONL file.
 * Non-blocking, fire-and-forget. Never throws.
 */
export async function appendHistory(entry: HistoryEntry): Promise<void> {
  try {
    await ensureConfigDir();
    await appendFile(HISTORY_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch {
    // Never fail the main command over history tracking
  }
}

/**
 * Read all history entries from the JSONL file.
 * Resilient to corrupted lines: skips any line that fails to parse.
 */
export async function readHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await readFile(HISTORY_FILE, 'utf-8');
    const entries: HistoryEntry[] = [];
    for (const line of raw.trim().split('\n')) {
      if (!line) continue;
      try {
        entries.push(JSON.parse(line) as HistoryEntry);
      } catch {
        // Skip corrupted line
      }
    }
    return entries;
  } catch {
    return [];
  }
}

export function getHistoryPath(): string {
  return HISTORY_FILE;
}
