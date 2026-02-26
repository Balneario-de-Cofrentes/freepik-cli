import { getApiKey } from './config.js';
import { FreepikApiError } from '../types.js';
import type { RateLimitInfo } from '../types.js';
import { debug } from './output.js';

const BASE_URL = 'https://api.freepik.com';

let verbose = false;

export function setVerbose(v: boolean): void {
  verbose = v;
}

// ── Rate Limit Tracking ────────────────────────────────────────────
let lastRateLimit: RateLimitInfo = {
  limit: null,
  remaining: null,
  reset: null,
};

export function getLastRateLimit(): RateLimitInfo {
  return { ...lastRateLimit };
}

let afterRequestCallback: ((info: RateLimitInfo) => void) | null = null;

export function setAfterRequestCallback(cb: ((info: RateLimitInfo) => void) | null): void {
  afterRequestCallback = cb;
}

function captureRateLimit(res: Response): void {
  const limit = res.headers.get('x-ratelimit-limit');
  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = res.headers.get('x-ratelimit-reset');

  lastRateLimit = {
    limit: limit ? Number(limit) : null,
    remaining: remaining ? Number(remaining) : null,
    reset: reset ? Number(reset) : null,
  };

  if (afterRequestCallback) {
    afterRequestCallback(lastRateLimit);
  }
}

export async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const apiKey = await getApiKey();

  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'x-freepik-api-key': apiKey,
    ...extraHeaders,
  };

  // Only set Content-Type for JSON bodies
  if (body && !extraHeaders?.['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (verbose) {
    debug(`${method} ${url}`);
    if (body) {
      const bodyStr = JSON.stringify(body, null, 2);
      // Truncate very long base64 values in debug output
      const truncated = bodyStr.replace(
        /("(?:image|image_url|image_base64|base64)":\s*")([A-Za-z0-9+/=]{100})[A-Za-z0-9+/=]+(")/g,
        '$1$2...[truncated]$3',
      );
      debug(`Body: ${truncated}`);
    }
  }

  const fetchBody =
    body && !extraHeaders?.['Content-Type']
      ? JSON.stringify(body)
      : (body as string | undefined);

  const res = await fetch(url, {
    method,
    headers,
    body: fetchBody,
  });

  // Capture rate limit headers from every response
  captureRateLimit(res);

  if (verbose) {
    debug(`Response: ${res.status} ${res.statusText}`);
    if (lastRateLimit.remaining !== null) {
      debug(`Rate limit: ${lastRateLimit.remaining}/${lastRateLimit.limit} remaining, resets in ${lastRateLimit.reset}s`);
    }
  }

  // Some endpoints return 200 with no body
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new FreepikApiError(res.status, (data ?? {}) as Record<string, unknown>);
  }

  return data as T;
}

export async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export async function get<T = unknown>(path: string): Promise<T> {
  return request<T>('GET', path);
}
