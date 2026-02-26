// ── CLI Global Options ──────────────────────────────────────────────
export interface GlobalOptions {
  verbose?: boolean;
  json?: boolean;
}

// ── Config ──────────────────────────────────────────────────────────
export interface CliConfig {
  apiKey?: string;
  outputDir?: string;
  defaultModel?: string;
  onboardedAt?: number;
  generations?: number;
  starNudgeShown?: boolean;
  lastOutputPath?: string;
}

// ── API Responses ───────────────────────────────────────────────────
export interface TaskCreateResponse {
  data: {
    task_id: string;
    status: string;
    [key: string]: unknown;
  };
}

export interface GeneratedItem {
  url: string;
  content_type?: string;
  [key: string]: unknown;
}

export interface TaskStatusResponse {
  data: {
    task_id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
    generated?: Array<string | GeneratedItem>;
    [key: string]: unknown;
  };
}

export interface ClassifyResponse {
  data: {
    ai_generated: number;
    [key: string]: unknown;
  };
}

export interface RemoveBgResponse {
  data: {
    image_url?: string;
    base64?: string;
    [key: string]: unknown;
  };
}

// ── API Error ───────────────────────────────────────────────────────
export class FreepikApiError extends Error {
  constructor(
    public statusCode: number,
    public body: Record<string, unknown>,
  ) {
    const msg =
      (body?.message as string) ??
      (body?.error as string) ??
      `API request failed with status ${statusCode}`;
    super(msg);
    this.name = 'FreepikApiError';
  }
}

// ── Model Registry ──────────────────────────────────────────────────
export interface ModelEntry {
  post: string;
  get: string;
  category: 'text-to-image' | 'image-to-video' | 'text-to-video';
}

// ── Rate Limit Info ─────────────────────────────────────────────────
export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
}

// ── Generate Options ────────────────────────────────────────────────
export interface GenerateOptions extends GlobalOptions {
  model: string;
  output?: string;
  seed?: string;
  webhook?: string;
  download?: boolean;
  open?: boolean;
  count?: string;
  smart?: boolean;
  template?: string;
  vars?: string;
  nameTemplate?: string;
  // Mystic-specific
  resolution?: string;
  aspectRatio?: string;
  style?: string;
  creativeDetailing?: string;
  engine?: string;
  // Flux-specific
  width?: string;
  height?: string;
  guidance?: string;
  format?: string;
  // Flux Dev extras
  colorEffect?: string;
  framing?: string;
  lighting?: string;
}

// ── Upscale Options ─────────────────────────────────────────────────
export interface UpscaleOptions extends GlobalOptions {
  scale: string;
  optimizedFor?: string;
  prompt?: string;
  creativity?: string;
  hdr?: string;
  resemblance?: string;
  engine?: string;
  output?: string;
  download?: boolean;
}

// ── Expand Options ──────────────────────────────────────────────────
export interface ExpandOptions extends GlobalOptions {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  prompt?: string;
  engine?: string;
  output?: string;
  download?: boolean;
}

// ── Video Options ───────────────────────────────────────────────────
export interface VideoOptions extends GlobalOptions {
  model: string;
  image?: string;
  prompt?: string;
  output?: string;
  download?: boolean;
}

// ── Icon Options ────────────────────────────────────────────────────
export interface IconOptions extends GlobalOptions {
  style: string;
  format: string;
  steps?: string;
  guidance?: string;
  output?: string;
  download?: boolean;
}

// ── Simple command options ───────────────────────────────────────────
export interface SimpleImageOptions extends GlobalOptions {
  output?: string;
  prompt?: string;
  download?: boolean;
}

export interface MusicOptions extends GlobalOptions {
  output?: string;
  download?: boolean;
}

export interface ClassifyOptions extends GlobalOptions {}

export interface StatusOptions extends GlobalOptions {
  endpoint: string;
}

export interface StyleTransferOptions extends GlobalOptions {
  style: string;
  output?: string;
  download?: boolean;
  open?: boolean;
}

// ── Reimagine Options ──────────────────────────────────────────────
export interface ReimagineOptions extends GlobalOptions {
  prompt?: string;
  imagination?: string;
  aspectRatio?: string;
  webhook?: string;
  output?: string;
  download?: boolean;
  open?: boolean;
}

// ── Describe Options ───────────────────────────────────────────────
export interface DescribeOptions extends GlobalOptions {}

// ── Search Options ─────────────────────────────────────────────────
export interface SearchOptions extends GlobalOptions {
  term?: string;
  page?: string;
  limit?: string;
  order?: string;
  orientation?: string;
  type?: string;
  license?: string;
  aiGenerated?: boolean;
}

// ── LoRA Options ───────────────────────────────────────────────────
export interface LoraListOptions extends GlobalOptions {}

export interface LoraTrainOptions extends GlobalOptions {
  images: string;
  quality?: string;
  gender?: string;
  description?: string;
}

// ── Open Options ───────────────────────────────────────────────────
export interface OpenOptions extends GlobalOptions {
  url?: boolean;
}

// ── Batch Options ──────────────────────────────────────────────────
export interface BatchManifestItem {
  command: string;
  prompt?: string;
  model?: string;
  image?: string;
  scale?: string;
  output?: string;
  [key: string]: unknown;
}

export interface BatchOptions extends GlobalOptions {
  concurrency?: string;
}

// ── History Options ────────────────────────────────────────────────
export interface HistoryEntry {
  timestamp: string;
  command: string;
  model?: string;
  prompt?: string;
  seed?: number;
  taskId?: string;
  outputPath?: string;
  cost?: string;
  elapsed?: number;
}

export interface HistoryOptions extends GlobalOptions {
  limit?: string;
  search?: string;
  totalCost?: boolean;
}

// ── Models Options ─────────────────────────────────────────────────
export interface ModelsOptions extends GlobalOptions {}

// ── Templates Options ──────────────────────────────────────────────
export interface TemplatesOptions extends GlobalOptions {}

// ── Credits Options ────────────────────────────────────────────────
export interface CreditsOptions extends GlobalOptions {}
