import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { request, post, get, setVerbose, getLastRateLimit, setAfterRequestCallback } from '../../src/lib/api.js';
import { FreepikApiError } from '../../src/types.js';

// Mock fetch globally
global.fetch = vi.fn();

// Mock getApiKey to return a test key
vi.mock('../../src/lib/config.js', () => ({
  getApiKey: async () => 'test-api-key-12345',
}));

// Mock output module
vi.mock('../../src/lib/output.js', () => ({
  debug: vi.fn(),
}));

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setVerbose(false);
    setAfterRequestCallback(null);
  });

  describe('request', () => {
    it('should send correct headers with API key', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'test' }), { status: 200 }),
      );

      await request('GET', '/test/path');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.freepik.com/test/path',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-freepik-api-key': 'test-api-key-12345',
          }),
        }),
      );
    });

    it('should include Content-Type for JSON bodies', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'test' }), { status: 200 }),
      );

      await request('POST', '/test/path', { prompt: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should send body as JSON string for POST requests', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'test' }), { status: 200 }),
      );

      const body = { prompt: 'test prompt', model: 'flux' };
      await request('POST', '/test/path', body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(body),
        }),
      );
    });

    it('should throw FreepikApiError on non-200 response', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401 },
        ),
      );

      await expect(request('GET', '/test')).rejects.toThrow(FreepikApiError);
    });

    it('should capture error details in FreepikApiError', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const errorBody = { message: 'Rate limit exceeded' };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(errorBody), { status: 429 }),
      );

      try {
        await request('GET', '/test');
      } catch (err) {
        expect(err).toBeInstanceOf(FreepikApiError);
        const apiErr = err as FreepikApiError;
        expect(apiErr.statusCode).toBe(429);
        expect(apiErr.body).toEqual(errorBody);
      }
    });

    it('should handle empty response bodies', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response('', { status: 200 }),
      );

      const result = await request('GET', '/test');
      expect(result).toEqual({});
    });

    it('should parse JSON response correctly', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const responseData = { data: { task_id: '123', status: 'PENDING' } };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), { status: 200 }),
      );

      const result = await request('GET', '/test');
      expect(result).toEqual(responseData);
    });

    it('should construct full URL from base and path', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await request('GET', '/v1/ai/flux-2-turbo');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.freepik.com/v1/ai/flux-2-turbo',
        expect.any(Object),
      );
    });

    it('should not include Content-Type for GET requests', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await request('GET', '/test');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs?.headers).not.toHaveProperty('Content-Type');
    });

    it('should capture rate limit headers from response', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: {
            'x-ratelimit-limit': '1000',
            'x-ratelimit-remaining': '950',
            'x-ratelimit-reset': '60',
          },
        }),
      );

      await request('GET', '/test');

      const rateLimit = getLastRateLimit();
      expect(rateLimit.limit).toBe(1000);
      expect(rateLimit.remaining).toBe(950);
      expect(rateLimit.reset).toBe(60);
    });

    it('should handle missing rate limit headers', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await request('GET', '/test');

      const rateLimit = getLastRateLimit();
      expect(rateLimit.limit).toBeNull();
      expect(rateLimit.remaining).toBeNull();
      expect(rateLimit.reset).toBeNull();
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'test' }), { status: 200 }),
      );

      const body = { prompt: 'test' };
      await post('/test/path', body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        }),
      );
    });

    it('should return typed response', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const response = { data: { task_id: 'abc123' } };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(response), { status: 200 }),
      );

      const result = await post('/test', {});
      expect(result).toEqual(response);
    });
  });

  describe('get', () => {
    it('should make GET request without body', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'test' }), { status: 200 }),
      );

      await get('/test/path');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
          body: undefined,
        }),
      );
    });

    it('should return typed response', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const response = { data: { status: 'COMPLETED' } };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(response), { status: 200 }),
      );

      const result = await get('/test');
      expect(result).toEqual(response);
    });
  });

  describe('setVerbose', () => {
    it('should toggle verbose output', async () => {
      setVerbose(true);
      // Just verify it doesn't throw
      setVerbose(false);
      expect(true).toBe(true);
    });
  });

  describe('getLastRateLimit', () => {
    it('should return rate limit info object', () => {
      const rateLimit = getLastRateLimit();
      expect(rateLimit).toHaveProperty('limit');
      expect(rateLimit).toHaveProperty('remaining');
      expect(rateLimit).toHaveProperty('reset');
    });

    it('should return copy of rate limit info', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: {
            'x-ratelimit-limit': '1000',
            'x-ratelimit-remaining': '500',
            'x-ratelimit-reset': '30',
          },
        }),
      );

      await request('GET', '/test');
      const rateLimit1 = getLastRateLimit();
      const rateLimit2 = getLastRateLimit();

      // Should be equal but different objects
      expect(rateLimit1).toEqual(rateLimit2);
      expect(rateLimit1).not.toBe(rateLimit2);
    });
  });

  describe('setAfterRequestCallback', () => {
    it('should call callback with rate limit info', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const callback = vi.fn();

      setAfterRequestCallback(callback);

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: {
            'x-ratelimit-limit': '1000',
            'x-ratelimit-remaining': '900',
            'x-ratelimit-reset': '60',
          },
        }),
      );

      await request('GET', '/test');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 1000,
          remaining: 900,
          reset: 60,
        }),
      );
    });

    it('should clear callback when set to null', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const callback = vi.fn();

      setAfterRequestCallback(callback);
      setAfterRequestCallback(null);

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await request('GET', '/test');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle API error with message field', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: 'Invalid request' }),
          { status: 400 },
        ),
      );

      try {
        await request('GET', '/test');
      } catch (err) {
        expect((err as FreepikApiError).message).toBe('Invalid request');
      }
    });

    it('should handle API error with error field', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: 'API Error' }),
          { status: 500 },
        ),
      );

      try {
        await request('GET', '/test');
      } catch (err) {
        expect((err as FreepikApiError).message).toBe('API Error');
      }
    });

    it('should use status code as fallback error message', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 503 }),
      );

      try {
        await request('GET', '/test');
      } catch (err) {
        expect((err as FreepikApiError).message).toContain('503');
      }
    });

    it('should handle non-JSON error responses', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500 }),
      );

      try {
        await request('GET', '/test');
      } catch (err) {
        expect(err).toBeInstanceOf(FreepikApiError);
      }
    });
  });
});
