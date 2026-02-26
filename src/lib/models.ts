import type { ModelEntry } from '../types.js';

// ── Model Info (for credits/models commands) ───────────────────────
export interface ModelInfo {
  name: string;
  speed: 'Ultra-fast' | 'Fast' | 'Medium' | 'Slow';
  quality: 'Good' | 'Very Good' | 'Excellent';
  tier: 'Free' | 'Premium';
  costEstimate: string;
  notes: string;
  category: 'image' | 'video' | 'editing';
}

export const MODEL_INFO: Record<string, ModelInfo> = {
  'flux-2-turbo': {
    name: 'flux-2-turbo',
    speed: 'Fast',
    quality: 'Good',
    tier: 'Free',
    costEstimate: 'free (up to 100/day)',
    notes: 'Default, best speed/cost ratio',
    category: 'image',
  },
  'hyperflux': {
    name: 'hyperflux',
    speed: 'Ultra-fast',
    quality: 'Good',
    tier: 'Free',
    costEstimate: 'free (up to 100/day)',
    notes: 'Sub-second generation',
    category: 'image',
  },
  'flux-dev': {
    name: 'flux-dev',
    speed: 'Medium',
    quality: 'Very Good',
    tier: 'Free',
    costEstimate: 'free (up to 50/day)',
    notes: 'Supports styling effects (color, framing, lighting)',
    category: 'image',
  },
  'seedream-4': {
    name: 'seedream-4',
    speed: 'Fast',
    quality: 'Good',
    tier: 'Free',
    costEstimate: 'free (up to 50/day)',
    notes: 'ByteDance model',
    category: 'image',
  },
  'seedream-4.5': {
    name: 'seedream-4.5',
    speed: 'Fast',
    quality: 'Very Good',
    tier: 'Free',
    costEstimate: 'free (up to 50/day)',
    notes: 'Improved ByteDance model',
    category: 'image',
  },
  'flux-2-klein': {
    name: 'flux-2-klein',
    speed: 'Ultra-fast',
    quality: 'Good',
    tier: 'Free',
    costEstimate: 'free (up to 100/day)',
    notes: 'Lightweight, very fast',
    category: 'image',
  },
  'mystic': {
    name: 'mystic',
    speed: 'Medium',
    quality: 'Excellent',
    tier: 'Premium',
    costEstimate: '~\u20ac0.05/image',
    notes: 'Freepik flagship, ultra-realistic',
    category: 'image',
  },
  'flux-2-pro': {
    name: 'flux-2-pro',
    speed: 'Medium',
    quality: 'Very Good',
    tier: 'Premium',
    costEstimate: '~\u20ac0.04/image',
    notes: 'Professional grade',
    category: 'image',
  },
  'flux-kontext': {
    name: 'flux-kontext',
    speed: 'Medium',
    quality: 'Very Good',
    tier: 'Premium',
    costEstimate: '~\u20ac0.04/image',
    notes: 'Context-aware generation',
    category: 'image',
  },
  'flux-pro-1.1': {
    name: 'flux-pro-1.1',
    speed: 'Medium',
    quality: 'Very Good',
    tier: 'Premium',
    costEstimate: '~\u20ac0.04/image',
    notes: 'Flux Pro v1.1',
    category: 'image',
  },
  'runway': {
    name: 'runway',
    speed: 'Medium',
    quality: 'Excellent',
    tier: 'Premium',
    costEstimate: '~\u20ac0.05/image',
    notes: 'Runway model',
    category: 'image',
  },
  'kling-2.1-pro': {
    name: 'kling-2.1-pro',
    speed: 'Slow',
    quality: 'Very Good',
    tier: 'Premium',
    costEstimate: '~\u20ac0.25/video',
    notes: 'Image-to-video',
    category: 'video',
  },
  'kling-2.5-pro': {
    name: 'kling-2.5-pro',
    speed: 'Slow',
    quality: 'Excellent',
    tier: 'Premium',
    costEstimate: '~\u20ac0.28/video',
    notes: 'Image-to-video, improved',
    category: 'video',
  },
  'kling-2.6-pro': {
    name: 'kling-2.6-pro',
    speed: 'Slow',
    quality: 'Excellent',
    tier: 'Premium',
    costEstimate: '~\u20ac0.30/video',
    notes: 'Image-to-video, latest',
    category: 'video',
  },
  'hailuo-02': {
    name: 'hailuo-02',
    speed: 'Slow',
    quality: 'Excellent',
    tier: 'Premium',
    costEstimate: '~\u20ac0.20/video',
    notes: 'Minimax Hailuo, 1080p',
    category: 'video',
  },
  'wan-2.5-t2v': {
    name: 'wan-2.5-t2v',
    speed: 'Slow',
    quality: 'Very Good',
    tier: 'Premium',
    costEstimate: '~\u20ac0.15/video',
    notes: 'Text-to-video, 1080p',
    category: 'video',
  },
  'upscale': {
    name: 'upscale',
    speed: 'Medium',
    quality: 'Excellent',
    tier: 'Premium',
    costEstimate: '~\u20ac0.10/image',
    notes: 'Creative upscaler (2x-16x)',
    category: 'editing',
  },
  'remove-bg': {
    name: 'remove-bg',
    speed: 'Fast',
    quality: 'Very Good',
    tier: 'Premium',
    costEstimate: '~\u20ac0.05/image',
    notes: 'Background removal',
    category: 'editing',
  },
  'relight': {
    name: 'relight',
    speed: 'Medium',
    quality: 'Very Good',
    tier: 'Premium',
    costEstimate: '~\u20ac0.10/image',
    notes: 'Image relighting',
    category: 'editing',
  },
  'reimagine': {
    name: 'reimagine',
    speed: 'Medium',
    quality: 'Very Good',
    tier: 'Premium',
    costEstimate: '~\u20ac0.05/image',
    notes: 'Reimagine with different style',
    category: 'editing',
  },
};

// ── Text-to-Image Models ────────────────────────────────────────────
export const TEXT_TO_IMAGE_MODELS: Record<string, ModelEntry> = {
  'mystic': {
    post: '/v1/ai/mystic',
    get: '/v1/ai/mystic',
    category: 'text-to-image',
  },
  'flux-2-pro': {
    post: '/v1/ai/text-to-image/flux-2-pro',
    get: '/v1/ai/text-to-image/flux-2-pro',
    category: 'text-to-image',
  },
  'flux-2-turbo': {
    post: '/v1/ai/text-to-image/flux-2-turbo',
    get: '/v1/ai/text-to-image/flux-2-turbo',
    category: 'text-to-image',
  },
  'flux-2-klein': {
    post: '/v1/ai/text-to-image/flux-2-klein',
    get: '/v1/ai/text-to-image/flux-2-klein',
    category: 'text-to-image',
  },
  'flux-kontext': {
    post: '/v1/ai/text-to-image/flux-kontext-pro',
    get: '/v1/ai/text-to-image/flux-kontext-pro',
    category: 'text-to-image',
  },
  'flux-pro-1.1': {
    post: '/v1/ai/text-to-image/flux-pro-v1-1',
    get: '/v1/ai/text-to-image/flux-pro-v1-1',
    category: 'text-to-image',
  },
  'flux-dev': {
    post: '/v1/ai/text-to-image/flux-dev',
    get: '/v1/ai/text-to-image/flux-dev',
    category: 'text-to-image',
  },
  'hyperflux': {
    post: '/v1/ai/text-to-image/hyperflux',
    get: '/v1/ai/text-to-image/hyperflux',
    category: 'text-to-image',
  },
  'seedream-4': {
    post: '/v1/ai/text-to-image/seedream-4',
    get: '/v1/ai/text-to-image/seedream-4',
    category: 'text-to-image',
  },
  'seedream-4.5': {
    post: '/v1/ai/text-to-image/seedream-4-5',
    get: '/v1/ai/text-to-image/seedream-4-5',
    category: 'text-to-image',
  },
  'runway': {
    post: '/v1/ai/text-to-image/runway',
    get: '/v1/ai/text-to-image/runway',
    category: 'text-to-image',
  },
};

// ── Video Models ────────────────────────────────────────────────────
export const VIDEO_MODELS: Record<string, ModelEntry> = {
  'kling-2.1-pro': {
    post: '/v1/ai/image-to-video/kling-v2-1-pro',
    get: '/v1/ai/image-to-video/kling-v2-1-pro',
    category: 'image-to-video',
  },
  'kling-2.5-pro': {
    post: '/v1/ai/image-to-video/kling-v2-5-pro',
    get: '/v1/ai/image-to-video/kling-v2-5-pro',
    category: 'image-to-video',
  },
  'kling-2.6-pro': {
    post: '/v1/ai/image-to-video/kling-v2-6-pro',
    get: '/v1/ai/image-to-video/kling-v2-6-pro',
    category: 'image-to-video',
  },
  'hailuo-02': {
    post: '/v1/ai/image-to-video/minimax-hailuo-02-1080p',
    get: '/v1/ai/image-to-video/minimax-hailuo-02-1080p',
    category: 'image-to-video',
  },
  'wan-2.5-t2v': {
    post: '/v1/ai/text-to-video/wan-2-5-t2v-1080p',
    get: '/v1/ai/text-to-video/wan-2-5-t2v-1080p',
    category: 'text-to-video',
  },
};

// ── Other Endpoints ─────────────────────────────────────────────────
export const ENDPOINTS = {
  upscale: {
    post: '/v1/ai/upscaler-creative',
    get: '/v1/ai/upscaler-creative',
  },
  removeBg: {
    post: '/v1/ai/remove-background',
  },
  expand: {
    'flux-pro': {
      post: '/v1/ai/image-expand/flux-pro',
      get: '/v1/ai/image-expand/flux-pro',
    },
    'ideogram': {
      post: '/v1/ai/image-expand/ideogram',
      get: '/v1/ai/image-expand/ideogram',
    },
    'seedream-v4-5': {
      post: '/v1/ai/image-expand/seedream-v4-5',
      get: '/v1/ai/image-expand/seedream-v4-5',
    },
  },
  relight: {
    post: '/v1/ai/image-relight',
    get: '/v1/ai/image-relight',
  },
  styleTransfer: {
    post: '/v1/ai/image-style-transfer',
    get: '/v1/ai/image-style-transfer',
  },
  icon: {
    post: '/v1/ai/text-to-icon',
    get: '/v1/ai/text-to-icon',
  },
  music: {
    post: '/v1/ai/music-generation',
    get: '/v1/ai/music-generation',
  },
  sfx: {
    post: '/v1/ai/sound-effects',
    get: '/v1/ai/sound-effects',
  },
  classify: {
    post: '/v1/ai/classifier/image',
  },
  reimagine: {
    post: '/v1/ai/beta/text-to-image/reimagine-flux',
    get: '/v1/ai/beta/text-to-image/reimagine-flux',
  },
  describe: {
    post: '/v1/ai/image-to-prompt',
    get: '/v1/ai/image-to-prompt',
  },
  loras: {
    list: '/v1/ai/loras',
    trainCharacter: '/v1/ai/loras/characters',
    trainStyle: '/v1/ai/loras/styles',
  },
  search: '/v1/resources',
} as const;

export function getGenerateModel(name: string): ModelEntry {
  const model = TEXT_TO_IMAGE_MODELS[name];
  if (!model) {
    const available = Object.keys(TEXT_TO_IMAGE_MODELS).join(', ');
    throw new Error(`Unknown model "${name}". Available: ${available}`);
  }
  return model;
}

export function getVideoModel(name: string): ModelEntry {
  const model = VIDEO_MODELS[name];
  if (!model) {
    const available = Object.keys(VIDEO_MODELS).join(', ');
    throw new Error(`Unknown video model "${name}". Available: ${available}`);
  }
  return model;
}

export function listGenerateModels(): string[] {
  return Object.keys(TEXT_TO_IMAGE_MODELS);
}

export function listVideoModels(): string[] {
  return Object.keys(VIDEO_MODELS);
}
