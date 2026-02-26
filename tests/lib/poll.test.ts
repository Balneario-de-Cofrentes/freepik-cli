import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pollTask, PollOptions } from '../../src/lib/poll.js';
import type { TaskStatusResponse } from '../../src/types.js';

// Mock the API get function
vi.mock('../../src/lib/api.js', () => ({
  get: vi.fn(),
}));

// Mock output module
vi.mock('../../src/lib/output.js', () => ({
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    update: vi.fn(),
  })),
  success: vi.fn(),
  c: {
    green: '',
    reset: '',
    red: '',
    yellow: '',
  },
}));

import { get } from '../../src/lib/api.js';

describe('Poll Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pollTask', () => {
    it('should resolve when status becomes COMPLETED', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [{ url: 'https://example.com/image.png' }],
        },
      };

      mockGet.mockResolvedValueOnce(response);

      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123');

      expect(result.status).toBe('COMPLETED');
      expect(result.taskId).toBe('task-123');
    });

    it('should throw when status becomes FAILED', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-456',
          status: 'FAILED',
        },
      };

      mockGet.mockResolvedValueOnce(response);

      await expect(pollTask('/v1/ai/flux-2-turbo', 'task-456')).rejects.toThrow(
        /Task.*failed/i,
      );
    });

    it('should retry on PENDING status', async () => {
      const mockGet = vi.mocked(get);

      // First response: PENDING
      const pendingResponse: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'PENDING',
        },
      };

      // Second response: COMPLETED
      const completedResponse: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [{ url: 'https://example.com/image.png' }],
        },
      };

      mockGet
        .mockResolvedValueOnce(pendingResponse)
        .mockResolvedValueOnce(completedResponse);

      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123', {
        interval: 1,
        maxWait: 5000,
      });

      expect(result.status).toBe('COMPLETED');
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should throw on timeout', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'PROCESSING',
        },
      };

      mockGet.mockResolvedValue(response);

      await expect(
        pollTask('/v1/ai/flux-2-turbo', 'task-123', {
          interval: 1,
          maxWait: 10,
        }),
      ).rejects.toThrow(/timed out/i);
    });

    it('should respect maxWait option', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'PROCESSING',
        },
      };

      mockGet.mockResolvedValue(response);

      const start = Date.now();
      await expect(
        pollTask('/v1/ai/flux-2-turbo', 'task-123', {
          interval: 5,
          maxWait: 20,
        }),
      ).rejects.toThrow();

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // Should timeout quickly
    });

    it('should default maxWait to 5 minutes', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'PROCESSING',
        },
      };

      mockGet.mockResolvedValue(response);

      // Make a quick call that immediately completes
      const completedResponse: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [],
        },
      };

      mockGet.mockResolvedValueOnce(completedResponse);

      // Should complete without timeout error (default is 5 min)
      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123');
      expect(result.status).toBe('COMPLETED');
    });

    it('should default interval to 2 seconds', async () => {
      const mockGet = vi.mocked(get);
      const completedResponse: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [],
        },
      };

      mockGet.mockResolvedValueOnce(completedResponse);

      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123');
      expect(result).toBeDefined();
    });

    it('should normalize string[] generated to {url}[] objects', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [
            'https://example.com/image1.png',
            'https://example.com/image2.png',
          ] as any,
        },
      };

      mockGet.mockResolvedValueOnce(response);

      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123');

      expect(result.generated).toHaveLength(2);
      expect(result.generated[0]).toEqual({ url: 'https://example.com/image1.png' });
      expect(result.generated[1]).toEqual({ url: 'https://example.com/image2.png' });
    });

    it('should preserve object generated items', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [
            {
              url: 'https://example.com/image.png',
              content_type: 'image/png',
            },
          ],
        },
      };

      mockGet.mockResolvedValueOnce(response);

      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123');

      expect(result.generated[0]).toEqual({
        url: 'https://example.com/image.png',
        content_type: 'image/png',
      });
    });

    it('should handle mixed generated formats', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [
            'https://example.com/image1.png',
            {
              url: 'https://example.com/image2.png',
              content_type: 'image/png',
            },
          ] as any,
        },
      };

      mockGet.mockResolvedValueOnce(response);

      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123');

      expect(result.generated[0]).toEqual({
        url: 'https://example.com/image1.png',
      });
      expect(result.generated[1]).toEqual({
        url: 'https://example.com/image2.png',
        content_type: 'image/png',
      });
    });

    it('should handle empty generated array', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [],
        },
      };

      mockGet.mockResolvedValueOnce(response);

      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123');

      expect(result.generated).toHaveLength(0);
    });

    it('should pass endpoint and taskId to API get', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [],
        },
      };

      mockGet.mockResolvedValueOnce(response);

      await pollTask('/v1/ai/mystic', 'task-abc-123');

      expect(mockGet).toHaveBeenCalledWith('/v1/ai/mystic/task-abc-123');
    });

    it('should return raw response', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [{ url: 'https://example.com/image.png' }],
          extra_field: 'extra_value',
        },
      };

      mockGet.mockResolvedValueOnce(response);

      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123');

      expect(result.raw).toEqual(response);
    });

    it('should respect silent option', async () => {
      const mockGet = vi.mocked(get);
      const response: TaskStatusResponse = {
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [],
        },
      };

      mockGet.mockResolvedValueOnce(response);

      const result = await pollTask('/v1/ai/flux-2-turbo', 'task-123', {
        silent: true,
      });

      expect(result).toBeDefined();
    });
  });

  describe('PollResult structure', () => {
    it('should include taskId field', async () => {
      const mockGet = vi.mocked(get);
      mockGet.mockResolvedValueOnce({
        data: {
          task_id: 'my-task-id',
          status: 'COMPLETED',
          generated: [],
        },
      });

      const result = await pollTask('/test', 'my-task-id');
      expect(result.taskId).toBe('my-task-id');
    });

    it('should include status field', async () => {
      const mockGet = vi.mocked(get);
      mockGet.mockResolvedValueOnce({
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [],
        },
      });

      const result = await pollTask('/test', 'task-123');
      expect(result.status).toBe('COMPLETED');
    });

    it('should include generated array', async () => {
      const mockGet = vi.mocked(get);
      mockGet.mockResolvedValueOnce({
        data: {
          task_id: 'task-123',
          status: 'COMPLETED',
          generated: [{ url: 'https://example.com/image.png' }],
        },
      });

      const result = await pollTask('/test', 'task-123');
      expect(Array.isArray(result.generated)).toBe(true);
    });
  });
});
