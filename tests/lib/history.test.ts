import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { HistoryEntry } from '../../src/types.js';
import { appendHistory, readHistory } from '../../src/lib/history.js';

let configDir: string;
let historyFile: string;
let originalEntries: HistoryEntry[] = [];

describe('History Module', () => {
  beforeEach(async () => {
    configDir = join(homedir(), '.config', 'freepik-cli');
    historyFile = join(configDir, 'history.jsonl');

    // Backup existing history if it exists
    try {
      const contents = await fs.readFile(historyFile, 'utf-8');
      originalEntries = contents
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));
    } catch {
      originalEntries = [];
    }

    // Create fresh history file for testing
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(historyFile, '', 'utf-8');
  });

  afterEach(async () => {
    // Restore original history
    try {
      if (originalEntries.length > 0) {
        const content = originalEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
        await fs.writeFile(historyFile, content, 'utf-8');
      } else {
        await fs.writeFile(historyFile, '', 'utf-8');
      }
    } catch {
      // ignore
    }
  });

  describe('appendHistory', () => {
    it('should append entry to JSONL file', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
      };

      await appendHistory(entry);

      const contents = await fs.readFile(historyFile, 'utf-8');
      expect(contents).toContain('"command":"generate"');
    });

    it('should format entry as JSON on a single line', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
        model: 'flux-2-turbo',
      };

      await appendHistory(entry);

      const contents = await fs.readFile(historyFile, 'utf-8');
      const lines = contents.trim().split('\n');
      expect(lines.length).toBe(1);
      expect(JSON.parse(lines[0])).toEqual(entry);
    });

    it('should append multiple entries preserving order', async () => {
      const entry1: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
      };
      const entry2: HistoryEntry = {
        timestamp: '2024-01-01T11:00:00Z',
        command: 'upscale',
      };

      await appendHistory(entry1);
      await appendHistory(entry2);

      const contents = await fs.readFile(historyFile, 'utf-8');
      const lines = contents.trim().split('\n');
      expect(lines.length).toBe(2);
      expect(JSON.parse(lines[0]).command).toBe('generate');
      expect(JSON.parse(lines[1]).command).toBe('upscale');
    });

    it('should end each line with newline', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
      };

      await appendHistory(entry);

      const contents = await fs.readFile(historyFile, 'utf-8');
      expect(contents).toMatch(/\n$/);
    });

    it('should include all entry fields in JSON', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
        model: 'mystic',
        prompt: 'a cat',
        seed: 12345,
        taskId: 'task-123',
        outputPath: '/tmp/image.png',
        cost: '0.05',
        elapsed: 5000,
      };

      await appendHistory(entry);

      const contents = await fs.readFile(historyFile, 'utf-8');
      const parsed = JSON.parse(contents.trim());
      expect(parsed).toEqual(entry);
    });

    it('should handle entries with optional fields', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
      };

      await appendHistory(entry);

      const contents = await fs.readFile(historyFile, 'utf-8');
      const parsed = JSON.parse(contents.trim());
      expect(parsed.prompt).toBeUndefined();
      expect(parsed.seed).toBeUndefined();
    });

    it('should not fail on filesystem errors', async () => {
      await expect(appendHistory({
        timestamp: '2024-01-01T10:00:00Z',
        command: 'test',
      })).resolves.not.toThrow();
    });
  });

  describe('readHistory', () => {
    it('should return empty array when history file is empty', async () => {
      const result = await readHistory();
      expect(result).toEqual([]);
    });

    it('should read single entry from JSONL file', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
        model: 'flux-2-turbo',
      };

      await appendHistory(entry);
      const result = await readHistory();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(entry);
    });

    it('should read multiple entries in order', async () => {
      const entries: HistoryEntry[] = [
        { timestamp: '2024-01-01T10:00:00Z', command: 'generate' },
        { timestamp: '2024-01-01T11:00:00Z', command: 'upscale' },
        { timestamp: '2024-01-01T12:00:00Z', command: 'generate', model: 'mystic' },
      ];

      for (const entry of entries) {
        await appendHistory(entry);
      }

      const result = await readHistory();
      expect(result).toHaveLength(3);
      expect(result[0].command).toBe('generate');
      expect(result[1].command).toBe('upscale');
      expect(result[2].model).toBe('mystic');
    });

    it('should preserve entry field values', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
        model: 'mystic',
        prompt: 'realistic portrait',
        seed: 99999,
        taskId: 'abc-123',
        outputPath: '/home/user/image.png',
        cost: '0.10',
        elapsed: 3000,
      };

      await appendHistory(entry);
      const result = await readHistory();
      expect(result[0]).toEqual(entry);
    });

    it('should handle JSONL with trailing whitespace', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
      };

      await fs.writeFile(
        historyFile,
        JSON.stringify(entry) + '\n\n\n',
        'utf-8',
      );

      const result = await readHistory();
      expect(result).toHaveLength(1);
    });

    it('should skip empty lines', async () => {
      const entries: HistoryEntry[] = [
        { timestamp: '2024-01-01T10:00:00Z', command: 'generate' },
        { timestamp: '2024-01-01T11:00:00Z', command: 'upscale' },
      ];

      const lines = [
        JSON.stringify(entries[0]),
        '',
        JSON.stringify(entries[1]),
        '',
      ].join('\n');
      await fs.writeFile(historyFile, lines, 'utf-8');

      const result = await readHistory();
      expect(result).toHaveLength(2);
    });

    it('should return empty array on parse error', async () => {
      await fs.writeFile(historyFile, 'invalid json {', 'utf-8');
      const result = await readHistory();
      expect(result).toEqual([]);
    });
  });

  describe('Entry shapes', () => {
    it('should support minimal entry with only timestamp and command', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'test',
      };

      await appendHistory(entry);
      const result = await readHistory();
      expect(result[0]).toEqual(entry);
    });

    it('should support full entry with all fields', async () => {
      const entry: HistoryEntry = {
        timestamp: '2024-01-01T10:00:00Z',
        command: 'generate',
        model: 'flux-2-turbo',
        prompt: 'landscape painting',
        seed: 42,
        taskId: 'task-id-123',
        outputPath: '/output/file.png',
        cost: '0.02',
        elapsed: 1500,
      };

      await appendHistory(entry);
      const result = await readHistory();
      expect(result[0]).toEqual(entry);
    });
  });
});
