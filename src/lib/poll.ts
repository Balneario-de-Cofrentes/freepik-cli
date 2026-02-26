import { get } from './api.js';
import { createSpinner, success, c } from './output.js';
import type { TaskStatusResponse } from '../types.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PollOptions {
  maxWait?: number; // milliseconds, default 5 min
  interval?: number; // milliseconds, default 2s
  silent?: boolean; // suppress spinner output
}

export interface PollResult {
  taskId: string;
  status: string;
  generated: Array<{ url: string; content_type?: string; [key: string]: unknown }>;
  raw: TaskStatusResponse;
}

export async function pollTask(
  endpoint: string,
  taskId: string,
  opts?: PollOptions,
): Promise<PollResult> {
  const maxWait = opts?.maxWait ?? 300_000; // 5 minutes
  const interval = opts?.interval ?? 2_000; // 2 seconds
  const silent = opts?.silent ?? false;

  const spinner = silent ? null : createSpinner(`Waiting for task ${taskId.slice(0, 8)}...`);
  spinner?.start();

  const start = Date.now();

  try {
    while (Date.now() - start < maxWait) {
      const res = await get<TaskStatusResponse>(`${endpoint}/${taskId}`);
      const status = res.data.status;

      if (status === 'COMPLETED') {
        const rawGenerated = res.data.generated ?? [];
        // API may return string[] or {url,content_type}[] - normalize to objects
        const generated = rawGenerated.map((item: unknown) =>
          typeof item === 'string' ? { url: item } : item as { url: string; content_type?: string; [key: string]: unknown },
        );
        spinner?.stop(
          `${c.green}\u2713${c.reset} Task completed (${generated.length} file${generated.length !== 1 ? 's' : ''})`,
        );
        return {
          taskId,
          status,
          generated,
          raw: res,
        };
      }

      if (status === 'FAILED') {
        spinner?.stop(`${c.red}\u2717${c.reset} Task failed`);
        throw new Error(
          `Task ${taskId} failed. ${JSON.stringify(res.data)}`,
        );
      }

      spinner?.update(
        `Status: ${status} - waiting for task ${taskId.slice(0, 8)}...`,
      );

      await sleep(interval);
    }

    spinner?.stop(`${c.yellow}!${c.reset} Task timed out`);
    throw new Error(
      `Task ${taskId} timed out after ${maxWait / 1000}s. Check status with: freepik status ${taskId} --endpoint ${endpoint}`,
    );
  } catch (err) {
    spinner?.stop();
    throw err;
  }
}
