import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

/**
 * Determine if a string is a URL (starts with http:// or https://).
 */
function isUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://');
}

/**
 * Get MIME type from file extension.
 */
function mimeFromExt(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
  };
  return map[ext] ?? 'image/png';
}

export interface ImageInput {
  /** Base64 data URI (data:image/png;base64,...) for local files */
  base64?: string;
  /** Original URL for remote files */
  url?: string;
}

/**
 * Process an image input: if it's a local file, read and base64-encode it.
 * If it's a URL, pass it through.
 */
export async function processImageInput(input: string): Promise<ImageInput> {
  if (isUrl(input)) {
    return { url: input };
  }

  // Local file: read and base64 encode
  const buffer = await readFile(input);
  const mime = mimeFromExt(input);
  const base64 = `data:${mime};base64,${buffer.toString('base64')}`;
  return { base64 };
}

/**
 * Get the value to send to the API. Most Freepik endpoints accept
 * either a URL string or a base64 data URI in the "image" field.
 */
export async function getImageValue(input: string): Promise<string> {
  const result = await processImageInput(input);
  return result.base64 ?? result.url!;
}
