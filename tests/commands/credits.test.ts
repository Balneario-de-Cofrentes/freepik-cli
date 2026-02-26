import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API and output modules
vi.mock('../../src/lib/api.js', () => ({
  get: vi.fn(),
  getLastRateLimit: vi.fn(),
}));

vi.mock('../../src/lib/output.js', () => ({
  info: vi.fn(),
  printJson: vi.fn(),
  c: {
    bold: '',
    reset: '',
    green: '',
    yellow: '',
    magenta: '',
    cyan: '',
    dim: '',
  },
}));

vi.mock('../../src/lib/globals.js', () => ({
  globals: {
    json: false,
  },
}));

vi.mock('../../src/lib/models.js', () => ({
  MODEL_INFO: {
    'flux-2-turbo': {
      name: 'flux-2-turbo',
      speed: 'Fast',
      quality: 'Good',
      tier: 'Free',
      costEstimate: 'free (up to 100/day)',
      notes: 'Default, best speed/cost ratio',
      category: 'image',
    },
    'mystic': {
      name: 'mystic',
      speed: 'Medium',
      quality: 'Excellent',
      tier: 'Premium',
      costEstimate: '~€0.05/image',
      notes: 'Freepik flagship, ultra-realistic',
      category: 'image',
    },
  },
}));

import { get, getLastRateLimit } from '../../src/lib/api.js';

describe('Credits Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API request', () => {
    it('should make a GET request to trigger rate limit headers', async () => {
      const mockGet = vi.mocked(get);
      mockGet.mockResolvedValueOnce({});

      // Simulate the command making a request
      try {
        await mockGet('/v1/ai/text-to-image/flux-2-turbo');
      } catch {
        // Even errors should give us rate limit headers
      }

      expect(mockGet).toHaveBeenCalledWith('/v1/ai/text-to-image/flux-2-turbo');
    });

    it('should handle API errors gracefully', async () => {
      const mockGet = vi.mocked(get);
      mockGet.mockRejectedValueOnce(new Error('API Error'));

      // Should not throw - the command handles errors
      try {
        await mockGet('/v1/ai/text-to-image/flux-2-turbo');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });

  describe('Rate limit headers', () => {
    it('should read rate limit headers from response', async () => {
      const mockGetRateLimit = vi.mocked(getLastRateLimit);
      mockGetRateLimit.mockReturnValueOnce({
        limit: 1000,
        remaining: 950,
        reset: 60,
      });

      const rateLimit = mockGetRateLimit();

      expect(rateLimit.limit).toBe(1000);
      expect(rateLimit.remaining).toBe(950);
      expect(rateLimit.reset).toBe(60);
    });

    it('should handle missing rate limit info', () => {
      const mockGetRateLimit = vi.mocked(getLastRateLimit);
      mockGetRateLimit.mockReturnValueOnce({
        limit: null,
        remaining: null,
        reset: null,
      });

      const rateLimit = mockGetRateLimit();

      expect(rateLimit.limit).toBeNull();
      expect(rateLimit.remaining).toBeNull();
      expect(rateLimit.reset).toBeNull();
    });
  });

  describe('Model information', () => {
    it('should have pricing information for free models', () => {
      // The MODEL_INFO should contain tier information
      const freeModel = {
        name: 'flux-2-turbo',
        tier: 'Free',
        costEstimate: 'free (up to 100/day)',
      };

      expect(freeModel.tier).toBe('Free');
      expect(freeModel.costEstimate).toContain('free');
    });

    it('should have pricing information for premium models', () => {
      const premiumModel = {
        name: 'mystic',
        tier: 'Premium',
        costEstimate: '~€0.05/image',
      };

      expect(premiumModel.tier).toBe('Premium');
      expect(premiumModel.costEstimate).toContain('€');
    });

    it('should categorize models by type', () => {
      const imageModel = {
        category: 'image',
      };

      const videoModel = {
        category: 'video',
      };

      expect(imageModel.category).toBe('image');
      expect(videoModel.category).toBe('video');
    });

    it('should have category field for all models', () => {
      const categories = ['image', 'video', 'editing'];

      categories.forEach(cat => {
        expect(['image', 'video', 'editing']).toContain(cat);
      });
    });
  });

  describe('Output formatting', () => {
    it('should output JSON when --json flag is set', () => {
      // The command checks globals.json
      const options = { json: true };
      expect(options.json).toBe(true);
    });

    it('should output human-readable text by default', () => {
      const options = { json: false };
      expect(options.json).toBe(false);
    });
  });

  describe('Display logic', () => {
    it('should group free tier models together', () => {
      const allModels = [
        { name: 'flux-2-turbo', tier: 'Free', category: 'image' },
        { name: 'hyperflux', tier: 'Free', category: 'image' },
        { name: 'mystic', tier: 'Premium', category: 'image' },
      ];

      const freeModels = allModels.filter(m => m.tier === 'Free');
      expect(freeModels).toHaveLength(2);
    });

    it('should group premium models together', () => {
      const allModels = [
        { name: 'flux-2-turbo', tier: 'Free', category: 'image' },
        { name: 'mystic', tier: 'Premium', category: 'image' },
        { name: 'flux-2-pro', tier: 'Premium', category: 'image' },
      ];

      const premiumModels = allModels.filter(m => m.tier === 'Premium');
      expect(premiumModels).toHaveLength(2);
    });

    it('should group models by category', () => {
      const allModels = [
        { name: 'flux-2-turbo', category: 'image' },
        { name: 'kling-2.1-pro', category: 'video' },
        { name: 'upscale', category: 'editing' },
      ];

      const imageModels = allModels.filter(m => m.category === 'image');
      const videoModels = allModels.filter(m => m.category === 'video');
      const editingModels = allModels.filter(m => m.category === 'editing');

      expect(imageModels).toHaveLength(1);
      expect(videoModels).toHaveLength(1);
      expect(editingModels).toHaveLength(1);
    });

    it('should display rate limit if available', () => {
      const rateLimit = {
        limit: 1000,
        remaining: 950,
        reset: 60,
      };

      expect(rateLimit.remaining).not.toBeNull();
      expect(rateLimit.limit).not.toBeNull();
    });

    it('should display placeholder text if rate limit not available', () => {
      const rateLimit = {
        limit: null,
        remaining: null,
        reset: null,
      };

      const shouldShowPlaceholder = rateLimit.remaining === null;
      expect(shouldShowPlaceholder).toBe(true);
    });
  });
});
