import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { processImageInput, getImageValue } from '../../src/lib/image-input.js';

let testDir: string;

describe('Image Input Module', () => {
  beforeEach(async () => {
    testDir = join(tmpdir(), `freepik-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('processImageInput', () => {
    it('should pass through HTTP URL as-is', async () => {
      const url = 'http://example.com/image.png';
      const result = await processImageInput(url);
      expect(result).toEqual({ url });
    });

    it('should pass through HTTPS URL as-is', async () => {
      const url = 'https://example.com/image.png';
      const result = await processImageInput(url);
      expect(result).toEqual({ url });
    });

    it('should read local PNG file and return base64', async () => {
      const filePath = join(testDir, 'test.png');
      const content = Buffer.from([137, 80, 78, 71]); // PNG header
      await fs.writeFile(filePath, content);

      const result = await processImageInput(filePath);
      expect(result.base64).toBeDefined();
      expect(result.base64).toMatch(/^data:image\/png;base64,/);
      expect(result.url).toBeUndefined();
    });

    it('should read local JPEG file and return base64', async () => {
      const filePath = join(testDir, 'test.jpg');
      const content = Buffer.from([0xff, 0xd8, 0xff]); // JPEG header
      await fs.writeFile(filePath, content);

      const result = await processImageInput(filePath);
      expect(result.base64).toBeDefined();
      expect(result.base64).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should read local WEBP file and return base64', async () => {
      const filePath = join(testDir, 'test.webp');
      const content = Buffer.from([0x52, 0x49, 0x46, 0x46]); // WEBP header
      await fs.writeFile(filePath, content);

      const result = await processImageInput(filePath);
      expect(result.base64).toBeDefined();
      expect(result.base64).toMatch(/^data:image\/webp;base64,/);
    });

    it('should throw error for non-existent file', async () => {
      const filePath = join(testDir, 'non-existent.png');
      await expect(processImageInput(filePath)).rejects.toThrow();
    });

    it('should base64 encode file contents correctly', async () => {
      const filePath = join(testDir, 'test.png');
      const testData = Buffer.from('test data');
      await fs.writeFile(filePath, testData);

      const result = await processImageInput(filePath);
      const base64Part = result.base64!.split(',')[1];
      const decoded = Buffer.from(base64Part, 'base64').toString();
      expect(decoded).toBe('test data');
    });

    it('should handle file extension case-insensitively', async () => {
      const filePath = join(testDir, 'test.PNG');
      const content = Buffer.from([137, 80, 78, 71]);
      await fs.writeFile(filePath, content);

      const result = await processImageInput(filePath);
      expect(result.base64).toMatch(/^data:image\/png;base64,/);
    });

    it('should default to PNG MIME type for unknown extensions', async () => {
      const filePath = join(testDir, 'test.unknown');
      const content = Buffer.from([0x00, 0x01]);
      await fs.writeFile(filePath, content);

      const result = await processImageInput(filePath);
      expect(result.base64).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('getImageValue', () => {
    it('should return URL for HTTP URL input', async () => {
      const url = 'https://example.com/image.png';
      const result = await getImageValue(url);
      expect(result).toBe(url);
    });

    it('should return base64 for local file', async () => {
      const filePath = join(testDir, 'test.png');
      const content = Buffer.from([137, 80, 78, 71]);
      await fs.writeFile(filePath, content);

      const result = await getImageValue(filePath);
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should prefer base64 over URL when both available', async () => {
      const filePath = join(testDir, 'test.png');
      const content = Buffer.from([137, 80, 78, 71]);
      await fs.writeFile(filePath, content);

      const result = await getImageValue(filePath);
      expect(result).toMatch(/^data:image/);
      expect(result).not.toContain('http');
    });

    it('should throw on non-existent file', async () => {
      const filePath = join(testDir, 'missing.png');
      await expect(getImageValue(filePath)).rejects.toThrow();
    });
  });

  describe('MIME type mapping', () => {
    const mimeTests = [
      { ext: '.png', mime: 'image/png' },
      { ext: '.jpg', mime: 'image/jpeg' },
      { ext: '.jpeg', mime: 'image/jpeg' },
      { ext: '.webp', mime: 'image/webp' },
      { ext: '.gif', mime: 'image/gif' },
      { ext: '.bmp', mime: 'image/bmp' },
    ];

    mimeTests.forEach(({ ext, mime }) => {
      it(`should map ${ext} to ${mime}`, async () => {
        const filePath = join(testDir, `test${ext}`);
        const content = Buffer.from([0x00, 0x01]);
        await fs.writeFile(filePath, content);

        const result = await processImageInput(filePath);
        expect(result.base64).toMatch(new RegExp(`^data:${mime.replace(/\//g, '\\/')};base64,`));
      });
    });

    it('should map .svg to image/svg+xml', async () => {
      const filePath = join(testDir, 'test.svg');
      const content = Buffer.from([0x00, 0x01]);
      await fs.writeFile(filePath, content);

      const result = await processImageInput(filePath);
      expect(result.base64).toContain('image/svg+xml');
      expect(result.base64).toMatch(/^data:image\/svg\+xml;base64,/);
    });
  });
});
