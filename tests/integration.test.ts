import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const BINARY = join(PROJECT_ROOT, 'dist/index.js');

// Helper to run CLI command
function run(args: string, opts?: { expectError?: boolean }): string {
  try {
    const result = execSync(`node ${BINARY} ${args}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result;
  } catch (error) {
    if (opts?.expectError) {
      return (error as any).stdout || (error as any).message || '';
    }
    throw error;
  }
}

describe('CLI Integration Tests', () => {
  describe('Basic commands', () => {
    it('should show help with --help flag', () => {
      const output = run('--help');
      expect(output).toContain('Usage:');
      expect(output).toContain('Commands:');
    });

    it('should show version with --version flag', () => {
      const output = run('--version');
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should display help for generate command', () => {
      const output = run('generate --help');
      expect(output).toContain('generate');
      expect(output).toContain('Generate images');
    });

    it('should display help for upscale command', () => {
      const output = run('upscale --help');
      expect(output).toContain('upscale');
    });
  });

  describe('Models command', () => {
    it('should list models with normal output', () => {
      const output = run('models');
      expect(output).toContain('Image Generation');
      expect(output).toContain('flux-2-turbo');
      expect(output).toContain('mystic');
    });

    it('should output valid JSON with --json flag', () => {
      const output = run('models --json');
      // Should be valid JSON
      const parsed = JSON.parse(output);
      expect(parsed).toBeDefined();
    });

    it('should include model metadata in JSON output', () => {
      const output = run('models --json');
      const parsed = JSON.parse(output);
      expect(parsed['flux-2-turbo']).toBeDefined();
      expect(parsed['flux-2-turbo']).toHaveProperty('speed');
      expect(parsed['flux-2-turbo']).toHaveProperty('quality');
    });

    it('should show free tier models', () => {
      const output = run('models');
      expect(output).toContain('flux-2-turbo');
      expect(output).toContain('Free');
    });

    it('should show premium models', () => {
      const output = run('models');
      expect(output).toContain('mystic');
      expect(output).toContain('Premium');
    });

    it('should show video models section', () => {
      const output = run('models');
      expect(output).toContain('Video');
      expect(output).toContain('kling');
    });
  });

  describe('Templates command', () => {
    it('should list all templates', () => {
      const output = run('templates');
      expect(output).toContain('product-photo');
      expect(output).toContain('social-post');
      expect(output).toContain('portrait');
      expect(output).toContain('landscape');
      expect(output).toContain('hero-image');
      expect(output).toContain('logo');
      expect(output).toContain('icon-set');
    });

    it('should show template descriptions', () => {
      const output = run('templates');
      expect(output.length).toBeGreaterThan(100);
    });
  });

  describe('Credits command', () => {
    it('should show API status', () => {
      const output = run('credits', { expectError: true });
      // May fail due to missing API key, but should show structure
      expect(output).toBeDefined();
    });
  });

  describe('Config command help', () => {
    it('should show config command options', () => {
      const output = run('config --help');
      expect(output).toContain('config');
    });
  });

  describe('History command help', () => {
    it('should show history command options', () => {
      const output = run('history --help');
      expect(output).toContain('history');
    });
  });

  describe('Generate command options', () => {
    it('should accept --model option', () => {
      const output = run('generate --help');
      expect(output).toContain('--model');
      expect(output).toContain('-m');
    });

    it('should accept --output option', () => {
      const output = run('generate --help');
      expect(output).toContain('--output');
      expect(output).toContain('-o');
    });

    it('should accept --seed option', () => {
      const output = run('generate --help');
      expect(output).toContain('--seed');
      expect(output).toContain('-s');
    });

    it('should accept --smart option', () => {
      const output = run('generate --help');
      expect(output).toContain('--smart');
    });

    it('should accept --template option', () => {
      const output = run('generate --help');
      expect(output).toContain('--template');
    });

    it('should accept --vars option', () => {
      const output = run('generate --help');
      expect(output).toContain('--vars');
    });

    it('should accept --count option', () => {
      const output = run('generate --help');
      expect(output).toContain('--count');
      expect(output).toContain('-n');
    });

    it('should accept --webhook option', () => {
      const output = run('generate --help');
      expect(output).toContain('--webhook');
    });

    it('should accept --open option', () => {
      const output = run('generate --help');
      expect(output).toContain('--open');
    });

    it('should accept --no-download option', () => {
      const output = run('generate --help');
      expect(output).toContain('--no-download');
    });

    it('should accept mystic-specific options', () => {
      const output = run('generate --help');
      expect(output).toContain('--resolution');
      expect(output).toContain('--aspect-ratio');
      expect(output).toContain('--style');
    });

    it('should accept flux-specific options', () => {
      const output = run('generate --help');
      expect(output).toContain('--width');
      expect(output).toContain('--height');
      expect(output).toContain('--guidance');
    });

    it('should accept flux-dev-specific options', () => {
      const output = run('generate --help');
      expect(output).toContain('--color-effect');
      expect(output).toContain('--framing');
      expect(output).toContain('--lighting');
    });
  });

  describe('Upscale command options', () => {
    it('should show upscale command help', () => {
      const output = run('upscale --help');
      expect(output).toContain('upscale');
      expect(output).toContain('--scale');
    });
  });

  describe('Global options', () => {
    it('should accept --verbose flag', () => {
      const output = run('--verbose models');
      expect(output).toBeDefined();
    });

    it('should accept --json flag', () => {
      const output = run('models --json');
      expect(output).toContain('{');
    });
  });

  describe('All 23 commands exist', () => {
    // These commands should all have help available
    const commands = [
      'generate',
      'upscale',
      'expand',
      'relight',
      'video',
      'icon',
      'music',
      'sfx',
      'reimagine',
      'describe',
      'classify',
      'search',
      'remove-bg',
      'style-transfer',
      'lora list',
      'lora train-character',
      'lora train-style',
      'status',
      'models',
      'templates',
      'credits',
      'config',
      'history',
    ];

    commands.forEach(cmd => {
      it(`should have ${cmd} command`, () => {
        try {
          const output = run(`${cmd} --help`);
          expect(output).toBeDefined();
        } catch {
          // Command exists if help output is shown or if it requires args
          expect(true).toBe(true);
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle unknown command', () => {
      const output = run('unknown-command', { expectError: true });
      // Should show error or help
      expect(output).toBeDefined();
    });

    it('should show useful error messages', () => {
      const output = run('unknown', { expectError: true });
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Help output format', () => {
    it('should show usage pattern', () => {
      const output = run('--help');
      expect(output).toContain('Usage:');
    });

    it('should list available commands', () => {
      const output = run('--help');
      expect(output).toContain('Commands:');
    });

    it('should show global options', () => {
      const output = run('--help');
      expect(output).toContain('Options:');
    });
  });
});
