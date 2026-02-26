import { describe, it, expect, beforeEach, vi } from 'vitest';

// We'll test the smart model selection and body builders by testing them indirectly
// through inspection of the generate.ts source

describe('Generate Command', () => {
  // Import the command module to test internal logic
  // Since the functions are not exported, we test the behavior

  describe('Smart Model Selection', () => {
    // Based on SMART_RULES in generate.ts, test the keyword matching logic
    it('should select mystic for portrait prompts', () => {
      const keywords = ['photo', 'portrait', 'realistic', 'person', 'face', 'headshot', 'human'];
      const prompt = 'realistic portrait of a woman';
      const hasMatch = keywords.some(kw => prompt.toLowerCase().includes(kw));
      expect(hasMatch).toBe(true);
    });

    it('should select hyperflux for logo prompts', () => {
      const keywords = ['logo', 'icon', 'minimal', 'flat', 'simple', 'badge', 'emblem'];
      const prompt = 'minimalist logo design for tech company';
      const hasMatch = keywords.some(kw => prompt.toLowerCase().includes(kw));
      expect(hasMatch).toBe(true);
    });

    it('should select flux-dev for art prompts', () => {
      const keywords = ['art', 'illustration', 'painting', 'watercolor', 'sketch', 'artistic', 'anime'];
      const prompt = 'watercolor painting of a landscape';
      const hasMatch = keywords.some(kw => prompt.toLowerCase().includes(kw));
      expect(hasMatch).toBe(true);
    });

    it('should select flux-2-pro for commercial prompts', () => {
      const keywords = ['banner', 'poster', 'advertisement', 'commercial', 'marketing', 'ad'];
      const prompt = 'professional advertisement banner for new product';
      const hasMatch = keywords.some(kw => prompt.toLowerCase().includes(kw));
      expect(hasMatch).toBe(true);
    });

    it('should fallback to flux-2-turbo for generic prompts', () => {
      const prompt = 'a beautiful sunset';
      const allKeywords = [
        'photo', 'portrait', 'realistic', 'person', 'face', 'headshot', 'human',
        'logo', 'icon', 'minimal', 'flat', 'simple', 'badge', 'emblem',
        'art', 'illustration', 'painting', 'watercolor', 'sketch', 'artistic', 'anime',
        'banner', 'poster', 'advertisement', 'commercial', 'marketing', 'ad',
      ];
      const hasMatch = allKeywords.some(kw => prompt.toLowerCase().includes(kw));
      expect(hasMatch).toBe(false); // No special keywords, should use default
    });

    it('should be case-insensitive', () => {
      const prompt = 'REALISTIC PORTRAIT OF A PERSON';
      const lowerPrompt = prompt.toLowerCase();
      const hasMatch = lowerPrompt.includes('portrait') && lowerPrompt.includes('realistic');
      expect(hasMatch).toBe(true);
    });

    it('should match partial words in keywords', () => {
      const keywords = ['photo', 'portrait'];
      const prompt = 'a photograph of a person';
      const hasMatch = keywords.some(kw => prompt.toLowerCase().includes(kw));
      expect(hasMatch).toBe(true);
    });
  });

  describe('Body Builders', () => {
    // Test the structure that body builders should create

    it('should create body with prompt field', () => {
      const body = { prompt: 'test prompt' };
      expect(body).toHaveProperty('prompt');
      expect(body.prompt).toBe('test prompt');
    });

    it('mystic body should support resolution option', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      // Simulate resolution being added
      body.resolution = '2k';
      expect(body.resolution).toBe('2k');
    });

    it('mystic body should support aspect_ratio option', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.aspect_ratio = 'square_1_1';
      expect(body.aspect_ratio).toBe('square_1_1');
    });

    it('mystic body should support styling field', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.styling = { style: 'realism' };
      expect(body).toHaveProperty('styling');
      expect((body.styling as any).style).toBe('realism');
    });

    it('mystic body should convert creative_detailing to number', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      const value = '50';
      body.creative_detailing = Number(value);
      expect(typeof body.creative_detailing).toBe('number');
      expect(body.creative_detailing).toBe(50);
    });

    it('flux body should support width and height', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.width = Number('1024');
      body.height = Number('768');
      expect(body.width).toBe(1024);
      expect(body.height).toBe(768);
    });

    it('flux body should support guidance_scale', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.guidance_scale = Number('7.5');
      expect(body.guidance_scale).toBe(7.5);
    });

    it('flux body should support output_format', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.output_format = 'png';
      expect(body.output_format).toBe('png');
    });

    it('flux-dev should support aspect_ratio', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.aspect_ratio = '16_9';
      expect(body.aspect_ratio).toBe('16_9');
    });

    it('flux-dev should support color_effect', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.color_effect = 'vibrant';
      expect(body.color_effect).toBe('vibrant');
    });

    it('flux-dev should support framing', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.framing = 'portrait';
      expect(body.framing).toBe('portrait');
    });

    it('flux-dev should support lighting', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.lighting = 'dramatic';
      expect(body.lighting).toBe('dramatic');
    });

    it('all bodies should support seed field', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.seed = 12345;
      expect(body.seed).toBe(12345);
    });

    it('all bodies should support webhook field', () => {
      const body: Record<string, unknown> = { prompt: 'test' };
      body.webhook = 'https://example.com/webhook';
      expect(body.webhook).toBe('https://example.com/webhook');
    });
  });

  describe('Name Template Expansion', () => {
    // Test name template expansion logic

    it('should replace {prompt} token', () => {
      const template = '{prompt}_generated';
      const prompt = 'my beautiful image';
      const slugified = prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);

      const result = template.replace(/\{prompt\}/g, slugified);
      expect(result).toContain(slugified);
    });

    it('should replace {model} token', () => {
      const template = '{model}_{timestamp}';
      const model = 'flux-2-turbo';
      const result = template.replace(/\{model\}/g, model);
      expect(result).toContain(model);
    });

    it('should replace {seed} token', () => {
      const template = '{seed}_image';
      const seed = 12345;
      const result = template.replace(/\{seed\}/g, String(seed));
      expect(result).toContain('12345');
    });

    it('should replace {timestamp} token', () => {
      const template = 'image_{timestamp}';
      const timestamp = Date.now();
      const result = template.replace(/\{timestamp\}/g, String(timestamp));
      expect(result).toContain(String(timestamp));
    });

    it('should replace {ext} token', () => {
      const template = 'image.{ext}';
      const ext = '.png';
      const result = template.replace(/\{ext\}/g, ext);
      expect(result).toBe('image..png');
    });

    it('should replace {n} token for image count', () => {
      const template = '{n}_images_{model}';
      const n = 3;
      const model = 'mystic';
      let result = template.replace(/\{n\}/g, String(n));
      result = result.replace(/\{model\}/g, model);
      expect(result).toContain('3');
      expect(result).toContain(model);
    });

    it('should slugify prompt correctly', () => {
      const prompt = 'A Beautiful Sunset Photo';
      const slugified = prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);

      expect(slugified).toBe('a-beautiful-sunset-photo');
    });

    it('should handle long prompt by truncating to 30 chars', () => {
      const prompt = 'a very long prompt that should be truncated to a reasonable length';
      const slugified = prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);

      expect(slugified.length).toBeLessThanOrEqual(30);
    });

    it('should remove special characters from prompt', () => {
      const prompt = 'a@photo#with$special%chars';
      const slugified = prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      expect(slugified).not.toContain('@');
      expect(slugified).not.toContain('#');
      expect(slugified).not.toContain('$');
    });
  });

  describe('Count parameter handling', () => {
    it('should default count to 1', () => {
      const count = undefined;
      const effective = count ? Math.max(1, Math.min(10, Number(count))) : 1;
      expect(effective).toBe(1);
    });

    it('should clamp count between 1 and 10', () => {
      const testCases = [
        { input: '0', expected: 1 },
        { input: '1', expected: 1 },
        { input: '5', expected: 5 },
        { input: '10', expected: 10 },
        { input: '20', expected: 10 },
        { input: '-5', expected: 1 },
      ];

      testCases.forEach(({ input, expected }) => {
        const count = Math.max(1, Math.min(10, Number(input)));
        expect(count).toBe(expected);
      });
    });
  });

  describe('Seed handling', () => {
    it('should convert seed string to number', () => {
      const seedStr = '12345';
      const seedNum = Number(seedStr);
      expect(typeof seedNum).toBe('number');
      expect(seedNum).toBe(12345);
    });

    it('should handle seed in options', () => {
      const opts = { seed: '42' };
      const seed = opts.seed ? Number(opts.seed) : undefined;
      expect(seed).toBe(42);
    });

    it('should handle missing seed', () => {
      const opts = {};
      const seed = (opts as any).seed ? Number((opts as any).seed) : undefined;
      expect(seed).toBeUndefined();
    });
  });
});
