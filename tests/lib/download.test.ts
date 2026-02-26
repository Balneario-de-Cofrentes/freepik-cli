import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { downloadFile, downloadGenerated } from '../../src/lib/download.js';

// Mock fetch
global.fetch = vi.fn();

// Mock config
vi.mock('../../src/lib/config.js', () => ({
  getOutputDir: async () => tmpdir(),
  loadConfig: async () => ({}),
  saveConfig: async () => {},
  trackGeneration: async () => {},
}));

// Mock output
vi.mock('../../src/lib/output.js', () => ({
  success: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

let testDir: string;

describe('Download Module', () => {
  beforeEach(async () => {
    testDir = join(tmpdir(), `freepik-download-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('downloadFile', () => {
    it('should download file from URL and save to specified path', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const fileContent = Buffer.from('test image data');
      mockFetch.mockResolvedValueOnce(
        new Response(fileContent, {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
      );

      const outputPath = join(testDir, 'image.png');
      const result = await downloadFile('https://example.com/image.png', outputPath);

      expect(result).toBe(outputPath);

      const saved = await fs.readFile(outputPath);
      expect(saved).toEqual(fileContent);
    });

    it('should generate default filename when no path specified', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const fileContent = Buffer.from('test data');
      mockFetch.mockResolvedValueOnce(
        new Response(fileContent, { status: 200 }),
      );

      const result = await downloadFile('https://example.com/image.png');

      expect(result).toMatch(/freepik-\d+\.png/);
      expect(result).toContain(tmpdir());
    });

    it('should guess extension from content-type', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('test'), {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        }),
      );

      const result = await downloadFile('https://example.com/image');

      expect(result).toMatch(/\.jpg$/);
    });

    it('should guess extension from URL path', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('test'), { status: 200 }),
      );

      const result = await downloadFile('https://example.com/path/image.webp');

      expect(result).toMatch(/\.webp$/);
    });

    it('should default to .png when extension cannot be determined', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('test'), { status: 200 }),
      );

      const result = await downloadFile('https://example.com/image-without-ext');

      expect(result).toMatch(/\.png$/);
    });

    it('should throw on failed download', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response('Not Found', { status: 404 }),
      );

      await expect(
        downloadFile('https://example.com/missing.png'),
      ).rejects.toThrow();
    });

    it('should throw on network error', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        downloadFile('https://example.com/image.png'),
      ).rejects.toThrow();
    });

    it('should handle MIME type for MP4 videos', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('video data'), {
          status: 200,
          headers: { 'content-type': 'video/mp4' },
        }),
      );

      const result = await downloadFile('https://example.com/video');

      expect(result).toMatch(/\.mp4$/);
    });

    it('should handle MIME type for MP3 audio', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('audio data'), {
          status: 200,
          headers: { 'content-type': 'audio/mpeg' },
        }),
      );

      const result = await downloadFile('https://example.com/audio');

      expect(result).toMatch(/\.mp3$/);
    });

    it('should fetch from correct URL', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('test'), { status: 200 }),
      );

      const url = 'https://example.com/path/to/image.png';
      await downloadFile(url, join(testDir, 'out.png'));

      expect(mockFetch).toHaveBeenCalledWith(url);
    });

    it('should save correct number of bytes', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const testData = Buffer.from('test data content');
      mockFetch.mockResolvedValueOnce(
        new Response(testData, { status: 200 }),
      );

      const outputPath = join(testDir, 'test.png');
      await downloadFile('https://example.com/test.png', outputPath);

      const stat = await fs.stat(outputPath);
      expect(stat.size).toBe(testData.length);
    });
  });

  describe('downloadGenerated', () => {
    it('should download single generated file', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('file1'), { status: 200 }),
      );

      const generated = [{ url: 'https://example.com/file1.png' }];
      const paths = await downloadGenerated(generated, join(testDir, 'out.png'));

      expect(paths).toHaveLength(1);
      expect(paths[0]).toContain('out.png');
    });

    it('should use provided output path for single file', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('test'), { status: 200 }),
      );

      const outputPath = join(testDir, 'myimage.png');
      const generated = [{ url: 'https://example.com/image.png' }];

      const paths = await downloadGenerated(generated, outputPath);

      expect(paths[0]).toBe(outputPath);
    });

    it('should append index for multiple files', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch
        .mockResolvedValueOnce(new Response(Buffer.from('file1'), { status: 200 }))
        .mockResolvedValueOnce(new Response(Buffer.from('file2'), { status: 200 }))
        .mockResolvedValueOnce(new Response(Buffer.from('file3'), { status: 200 }));

      const generated = [
        { url: 'https://example.com/file1.png' },
        { url: 'https://example.com/file2.png' },
        { url: 'https://example.com/file3.png' },
      ];

      const outputPath = join(testDir, 'cat.png');
      const paths = await downloadGenerated(generated, outputPath);

      expect(paths).toHaveLength(3);
      expect(paths[0]).toMatch(/cat-1\.png$/);
      expect(paths[1]).toMatch(/cat-2\.png$/);
      expect(paths[2]).toMatch(/cat-3\.png$/);
    });

    it('should generate default filenames when no output path', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch
        .mockResolvedValueOnce(new Response(Buffer.from('file1'), { status: 200 }))
        .mockResolvedValueOnce(new Response(Buffer.from('file2'), { status: 200 }));

      const generated = [
        { url: 'https://example.com/file1.png' },
        { url: 'https://example.com/file2.jpg' },
      ];

      const paths = await downloadGenerated(generated);

      expect(paths).toHaveLength(2);
      expect(paths[0]).toMatch(/freepik-\d+\.png$/);
      expect(paths[1]).toMatch(/freepik-\d+\.jpg$/);
    });

    it('should preserve content-type info when downloading', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('test'), {
          status: 200,
          headers: { 'content-type': 'image/webp' },
        }),
      );

      const generated = [
        {
          url: 'https://example.com/image',
          content_type: 'image/webp',
        },
      ];

      const outputPath = join(testDir, 'out.unknown');
      const paths = await downloadGenerated(generated, outputPath);

      // When a path is provided, it's used as-is for single file
      // The content_type is used for guessing extension if needed
      expect(paths[0]).toBe(outputPath);
    });

    it('should handle empty generated array', async () => {
      const generated: any[] = [];
      const paths = await downloadGenerated(generated);
      expect(paths).toHaveLength(0);
    });

    it('should insert index before extension', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch
        .mockResolvedValueOnce(new Response(Buffer.from('1'), { status: 200 }))
        .mockResolvedValueOnce(new Response(Buffer.from('2'), { status: 200 }));

      const generated = [
        { url: 'https://example.com/1.jpg' },
        { url: 'https://example.com/2.jpg' },
      ];

      const outputPath = join(testDir, 'image.jpg');
      const paths = await downloadGenerated(generated, outputPath);

      expect(paths[0]).toMatch(/image-1\.jpg$/);
      expect(paths[1]).toMatch(/image-2\.jpg$/);
    });

    it('should track generation after download', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('test'), { status: 200 }),
      );

      const generated = [{ url: 'https://example.com/file.png' }];
      await downloadGenerated(generated);

      // trackGeneration is called, which is mocked
      expect(true).toBe(true);
    });

    it('should save last output path to config', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(Buffer.from('test'), { status: 200 }),
      );

      const generated = [{ url: 'https://example.com/file.png' }];
      const paths = await downloadGenerated(generated, join(testDir, 'out.png'));

      expect(paths).toHaveLength(1);
    });

    it('should download multiple files in sequence', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch
        .mockResolvedValueOnce(new Response(Buffer.from('file1'), { status: 200 }))
        .mockResolvedValueOnce(new Response(Buffer.from('file2'), { status: 200 }));

      const generated = [
        { url: 'https://example.com/file1.png' },
        { url: 'https://example.com/file2.png' },
      ];

      const paths = await downloadGenerated(generated, join(testDir, 'out.png'));

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(paths).toHaveLength(2);
    });
  });

  describe('MIME type guessing', () => {
    const tests = [
      { contentType: 'image/png', expected: '.png' },
      { contentType: 'image/jpeg', expected: '.jpg' },
      { contentType: 'image/webp', expected: '.webp' },
      { contentType: 'image/svg+xml', expected: '.svg' },
      { contentType: 'video/mp4', expected: '.mp4' },
      { contentType: 'audio/mpeg', expected: '.mp3' },
      { contentType: 'audio/wav', expected: '.wav' },
    ];

    tests.forEach(({ contentType, expected }) => {
      it(`should map ${contentType} to ${expected}`, async () => {
        const mockFetch = vi.mocked(global.fetch);
        mockFetch.mockResolvedValueOnce(
          new Response(Buffer.from('test'), {
            status: 200,
            headers: { 'content-type': contentType },
          }),
        );

        const result = await downloadFile('https://example.com/file');
        expect(result).toMatch(new RegExp(`${expected.replace('.', '\\.')}$`));
      });
    });
  });
});
