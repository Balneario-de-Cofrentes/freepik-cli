import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as config from '../../src/lib/config.js';

// Mock the config directory for tests
let testConfigDir: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual('node:os');
  return {
    ...actual,
    homedir: () => tmpdir(),
  };
});

describe('Config Module', () => {
  beforeEach(async () => {
    testConfigDir = join(tmpdir(), '.config', 'freepik-cli');
    // Clean up any existing test config
    try {
      await fs.rm(testConfigDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(testConfigDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('loadConfig', () => {
    it('should return empty object when no config file exists', async () => {
      const result = await config.loadConfig();
      expect(result).toEqual({});
    });

    it('should load and parse config JSON file', async () => {
      const configFile = join(testConfigDir, 'config.json');
      await fs.mkdir(testConfigDir, { recursive: true });
      const testConfig = { apiKey: 'test-key', outputDir: '/test/out' };
      await fs.writeFile(configFile, JSON.stringify(testConfig, null, 2) + '\n', 'utf-8');

      const result = await config.loadConfig();
      expect(result).toEqual(testConfig);
    });

    it('should handle invalid JSON gracefully', async () => {
      const configFile = join(testConfigDir, 'config.json');
      await fs.mkdir(testConfigDir, { recursive: true });
      await fs.writeFile(configFile, 'invalid json {', 'utf-8');

      const result = await config.loadConfig();
      expect(result).toEqual({});
    });
  });

  describe('saveConfig', () => {
    it('should create config directory if it does not exist', async () => {
      const testConfig = { apiKey: 'test-key' };
      await config.saveConfig(testConfig);

      const configFile = join(testConfigDir, 'config.json');
      const contents = await fs.readFile(configFile, 'utf-8');
      expect(JSON.parse(contents)).toEqual(testConfig);
    });

    it('should save config as formatted JSON', async () => {
      const testConfig = {
        apiKey: 'test-key',
        outputDir: '/output',
        generations: 5,
      };
      await config.saveConfig(testConfig);

      const configFile = join(testConfigDir, 'config.json');
      const contents = await fs.readFile(configFile, 'utf-8');
      expect(contents).toContain('"apiKey": "test-key"');
      expect(contents).toContain('"outputDir": "/output"');
      expect(contents).toContain('"generations": 5');
    });

    it('should overwrite existing config', async () => {
      await config.saveConfig({ apiKey: 'old-key' });
      await config.saveConfig({ apiKey: 'new-key', outputDir: '/new' });

      const result = await config.loadConfig();
      expect(result.apiKey).toBe('new-key');
      expect(result.outputDir).toBe('/new');
    });
  });

  describe('getApiKey', () => {
    beforeEach(() => {
      delete process.env.FREEPIK_API_KEY;
    });

    it('should return env var when FREEPIK_API_KEY is set', async () => {
      process.env.FREEPIK_API_KEY = 'env-key-123';
      const result = await config.getApiKey();
      expect(result).toBe('env-key-123');
    });

    it('should return config file key when no env var', async () => {
      await config.saveConfig({ apiKey: 'config-key-456' });
      const result = await config.getApiKey();
      expect(result).toBe('config-key-456');
    });

    it('should prioritize env var over config file', async () => {
      process.env.FREEPIK_API_KEY = 'env-key';
      await config.saveConfig({ apiKey: 'config-key' });
      const result = await config.getApiKey();
      expect(result).toBe('env-key');
    });

    it('should throw when no API key found anywhere', async () => {
      await expect(config.getApiKey()).rejects.toThrow(/No API key found/);
    });

    it('should throw with helpful error message', async () => {
      await expect(config.getApiKey()).rejects.toThrow(
        /Set FREEPIK_API_KEY environment variable/,
      );
    });
  });

  describe('getOutputDir', () => {
    it('should return "." as default when not configured', async () => {
      const result = await config.getOutputDir();
      expect(result).toBe('.');
    });

    it('should return configured output directory', async () => {
      await config.saveConfig({ outputDir: '/my/output' });
      const result = await config.getOutputDir();
      expect(result).toBe('/my/output');
    });
  });

  describe('maskApiKey', () => {
    it('should mask API key format FPSX...lastfour', () => {
      const result = config.maskApiKey('FPSXabcdef1234');
      expect(result).toBe('FPSX...1234');
    });

    it('should mask with first 4 and last 4 characters', () => {
      const result = config.maskApiKey('long-api-key-with-many-characters');
      expect(result).toBe('long...ters');
    });

    it('should return **** for keys with 8 or fewer characters', () => {
      expect(config.maskApiKey('short')).toBe('****');
      expect(config.maskApiKey('12345678')).toBe('****');
    });

    it('should work with 9-character keys', () => {
      const result = config.maskApiKey('123456789');
      expect(result).toBe('1234...6789');
    });
  });

  describe('trackGeneration', () => {
    it('should increment generations counter', async () => {
      await config.saveConfig({ generations: 2 });
      await config.trackGeneration();
      const result = await config.loadConfig();
      expect(result.generations).toBe(3);
    });

    it('should initialize generations to 1 if not set', async () => {
      await config.trackGeneration();
      const result = await config.loadConfig();
      expect(result.generations).toBe(1);
    });

    it('should not fail on errors', async () => {
      // This should not throw even though it might encounter filesystem errors
      await expect(config.trackGeneration()).resolves.not.toThrow();
    });

    it('should set star nudge flag after 5 generations', async () => {
      await config.saveConfig({ generations: 4, starNudgeShown: false });
      await config.trackGeneration();
      const result = await config.loadConfig();
      expect(result.generations).toBe(5);
      expect(result.starNudgeShown).toBe(true);
    });

    it('should not show nudge if already shown', async () => {
      await config.saveConfig({ generations: 5, starNudgeShown: true });
      await config.trackGeneration();
      const result = await config.loadConfig();
      expect(result.generations).toBe(6);
      expect(result.starNudgeShown).toBe(true);
    });
  });
});
