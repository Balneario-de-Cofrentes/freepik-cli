import { writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { getOutputDir, trackGeneration, loadConfig, saveConfig } from './config.js';
import { success, warn, debug } from './output.js';

/**
 * Save the last output path to config (for `freepik open`).
 */
async function saveLastOutputPath(filePath: string): Promise<void> {
  const config = await loadConfig();
  config.lastOutputPath = filePath;
  await saveConfig(config);
}

/**
 * Generate a default filename based on timestamp and extension.
 */
function defaultFilename(ext: string): string {
  const ts = Date.now();
  return `freepik-${ts}${ext}`;
}

/**
 * Guess file extension from content-type or URL.
 */
function guessExtension(url: string, contentType?: string): string {
  if (contentType) {
    const map: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/mp3': '.mp3',
    };
    const ext = map[contentType];
    if (ext) return ext;
  }

  // Try to extract from URL path
  try {
    const urlPath = new URL(url).pathname;
    const ext = extname(urlPath);
    if (ext) return ext;
  } catch {
    // not a valid URL, ignore
  }

  return '.png'; // fallback
}

/**
 * Download a single file from a URL and save it to disk.
 */
export async function downloadFile(
  url: string,
  outputPath?: string,
  contentType?: string,
  verbose?: boolean,
): Promise<string> {
  if (verbose) {
    debug(`Downloading: ${url}`);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
  }

  const actualContentType = contentType ?? res.headers.get('content-type') ?? undefined;
  const ext = guessExtension(url, actualContentType);

  let filePath: string;
  if (outputPath) {
    filePath = outputPath;
  } else {
    const outputDir = await getOutputDir();
    filePath = join(outputDir, defaultFilename(ext));
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buffer);

  if (verbose) {
    debug(`Saved ${buffer.length} bytes to ${filePath}`);
  }

  return filePath;
}

/**
 * Download multiple generated files.
 * If a single output path is specified and there's only one file, use it directly.
 * For multiple files, append an index suffix.
 */
export async function downloadGenerated(
  generated: Array<{ url: string; content_type?: string }>,
  outputPath?: string,
  verbose?: boolean,
): Promise<string[]> {
  if (generated.length === 0) {
    warn('No files to download');
    return [];
  }

  const paths: string[] = [];

  for (let i = 0; i < generated.length; i++) {
    const item = generated[i];
    let fileDest: string | undefined;

    if (outputPath) {
      if (generated.length === 1) {
        fileDest = outputPath;
      } else {
        // Insert index before extension: cat.png -> cat-1.png, cat-2.png
        const ext = extname(outputPath);
        const base = outputPath.slice(0, outputPath.length - ext.length);
        fileDest = `${base}-${i + 1}${ext}`;
      }
    }

    const savedPath = await downloadFile(item.url, fileDest, item.content_type, verbose);
    paths.push(savedPath);
    success(`Saved to ${savedPath}`);
  }

  // Track successful generation (for one-time star nudge)
  await trackGeneration();

  // Save last output path for `freepik open` command (non-blocking)
  if (paths.length > 0) {
    saveLastOutputPath(paths[paths.length - 1]).catch(() => {});
  }

  return paths;
}
