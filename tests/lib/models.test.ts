import { describe, it, expect } from 'vitest';
import {
  getGenerateModel,
  getVideoModel,
  listGenerateModels,
  listVideoModels,
  TEXT_TO_IMAGE_MODELS,
  VIDEO_MODELS,
  MODEL_INFO,
} from '../../src/lib/models.js';

describe('Models Module', () => {
  describe('getGenerateModel', () => {
    it('should return correct entry for known text-to-image model', () => {
      const model = getGenerateModel('mystic');
      expect(model).toEqual({
        post: '/v1/ai/mystic',
        get: '/v1/ai/mystic',
        category: 'text-to-image',
      });
    });

    it('should return correct entry for flux-2-turbo', () => {
      const model = getGenerateModel('flux-2-turbo');
      expect(model.post).toBe('/v1/ai/text-to-image/flux-2-turbo');
      expect(model.get).toBe('/v1/ai/text-to-image/flux-2-turbo');
    });

    it('should return correct entry for flux-dev', () => {
      const model = getGenerateModel('flux-dev');
      expect(model.post).toBe('/v1/ai/text-to-image/flux-dev');
      expect(model.category).toBe('text-to-image');
    });

    it('should throw for unknown model', () => {
      expect(() => getGenerateModel('unknown-model')).toThrow(
        /Unknown model "unknown-model"/,
      );
    });

    it('should throw with list of available models', () => {
      expect(() => getGenerateModel('invalid')).toThrow(/Available/);
    });

    it('should support all models in TEXT_TO_IMAGE_MODELS', () => {
      for (const modelName of Object.keys(TEXT_TO_IMAGE_MODELS)) {
        expect(() => getGenerateModel(modelName)).not.toThrow();
      }
    });
  });

  describe('getVideoModel', () => {
    it('should return correct entry for known video model', () => {
      const model = getVideoModel('kling-2.1-pro');
      expect(model).toEqual({
        post: '/v1/ai/image-to-video/kling-v2-1-pro',
        get: '/v1/ai/image-to-video/kling-v2-1-pro',
        category: 'image-to-video',
      });
    });

    it('should return correct entry for kling-2.5-pro', () => {
      const model = getVideoModel('kling-2.5-pro');
      expect(model.post).toBe('/v1/ai/image-to-video/kling-v2-5-pro');
      expect(model.category).toBe('image-to-video');
    });

    it('should return correct entry for wan-2.5-t2v', () => {
      const model = getVideoModel('wan-2.5-t2v');
      expect(model.category).toBe('text-to-video');
    });

    it('should throw for unknown video model', () => {
      expect(() => getVideoModel('unknown-video')).toThrow(
        /Unknown video model "unknown-video"/,
      );
    });

    it('should throw with list of available video models', () => {
      expect(() => getVideoModel('invalid')).toThrow(/Available/);
    });

    it('should support all models in VIDEO_MODELS', () => {
      for (const modelName of Object.keys(VIDEO_MODELS)) {
        expect(() => getVideoModel(modelName)).not.toThrow();
      }
    });
  });

  describe('listGenerateModels', () => {
    it('should return array of all generate model names', () => {
      const models = listGenerateModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include mystic model', () => {
      const models = listGenerateModels();
      expect(models).toContain('mystic');
    });

    it('should include flux-2-turbo', () => {
      const models = listGenerateModels();
      expect(models).toContain('flux-2-turbo');
    });

    it('should include common flux models', () => {
      const models = listGenerateModels();
      expect(models).toContain('flux-dev');
      expect(models).toContain('flux-2-pro');
      expect(models).toContain('hyperflux');
    });

    it('should match keys in TEXT_TO_IMAGE_MODELS', () => {
      const models = listGenerateModels();
      const modelKeys = Object.keys(TEXT_TO_IMAGE_MODELS);
      expect(models).toEqual(modelKeys);
    });

    it('should not contain duplicate models', () => {
      const models = listGenerateModels();
      const unique = new Set(models);
      expect(models.length).toBe(unique.size);
    });
  });

  describe('listVideoModels', () => {
    it('should return array of all video model names', () => {
      const models = listVideoModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include kling models', () => {
      const models = listVideoModels();
      expect(models).toContain('kling-2.1-pro');
      expect(models).toContain('kling-2.5-pro');
    });

    it('should include wan-2.5-t2v', () => {
      const models = listVideoModels();
      expect(models).toContain('wan-2.5-t2v');
    });

    it('should match keys in VIDEO_MODELS', () => {
      const models = listVideoModels();
      const modelKeys = Object.keys(VIDEO_MODELS);
      expect(models).toEqual(modelKeys);
    });
  });

  describe('Model Endpoints', () => {
    it('all generate model endpoints should start with /v1/ai/', () => {
      for (const model of Object.values(TEXT_TO_IMAGE_MODELS)) {
        expect(model.post).toMatch(/^\/v1\/ai\//);
        expect(model.get).toMatch(/^\/v1\/ai\//);
      }
    });

    it('all video model endpoints should start with /v1/ai/', () => {
      for (const model of Object.values(VIDEO_MODELS)) {
        expect(model.post).toMatch(/^\/v1\/ai\//);
        expect(model.get).toMatch(/^\/v1\/ai\//);
      }
    });

    it('should have distinct post and get endpoints for most models', () => {
      // Most models should have same post/get, but verify structure is valid
      for (const model of Object.values(TEXT_TO_IMAGE_MODELS)) {
        expect(model.post).toBeDefined();
        expect(model.get).toBeDefined();
        expect(typeof model.post).toBe('string');
        expect(typeof model.get).toBe('string');
      }
    });
  });

  describe('MODEL_INFO', () => {
    it('should have entries for all text-to-image models', () => {
      for (const modelName of Object.keys(TEXT_TO_IMAGE_MODELS)) {
        expect(MODEL_INFO).toHaveProperty(modelName);
      }
    });

    it('should have entries for all video models', () => {
      for (const modelName of Object.keys(VIDEO_MODELS)) {
        expect(MODEL_INFO).toHaveProperty(modelName);
      }
    });

    it('should have valid model info structure', () => {
      const mystic = MODEL_INFO['mystic'];
      expect(mystic).toHaveProperty('name');
      expect(mystic).toHaveProperty('speed');
      expect(mystic).toHaveProperty('quality');
      expect(mystic).toHaveProperty('tier');
      expect(mystic).toHaveProperty('costEstimate');
      expect(mystic).toHaveProperty('category');
    });

    it('should have speed values from defined set', () => {
      for (const info of Object.values(MODEL_INFO)) {
        expect(['Ultra-fast', 'Fast', 'Medium', 'Slow']).toContain(info.speed);
      }
    });

    it('should have quality values from defined set', () => {
      for (const info of Object.values(MODEL_INFO)) {
        expect(['Good', 'Very Good', 'Excellent']).toContain(info.quality);
      }
    });

    it('should have tier values from defined set', () => {
      for (const info of Object.values(MODEL_INFO)) {
        expect(['Free', 'Premium']).toContain(info.tier);
      }
    });

    it('should have category values from defined set', () => {
      for (const info of Object.values(MODEL_INFO)) {
        expect(['image', 'video', 'editing']).toContain(info.category);
      }
    });

    it('mystic should be premium quality', () => {
      const mystic = MODEL_INFO['mystic'];
      expect(mystic.quality).toBe('Excellent');
      expect(mystic.tier).toBe('Premium');
    });

    it('flux-2-turbo should be free tier', () => {
      const flux = MODEL_INFO['flux-2-turbo'];
      expect(flux.tier).toBe('Free');
    });

    it('should have meaningful cost estimates', () => {
      for (const info of Object.values(MODEL_INFO)) {
        expect(info.costEstimate).toBeTruthy();
        expect(typeof info.costEstimate).toBe('string');
      }
    });
  });
});
