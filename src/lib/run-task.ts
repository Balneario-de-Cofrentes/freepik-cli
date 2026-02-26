import { globals } from './globals.js';
import { post } from './api.js';
import { pollTask } from './poll.js';
import { downloadGenerated } from './download.js';
import { openFile } from './open.js';
import { info, printJson } from './output.js';
import type { TaskCreateResponse } from '../types.js';

export interface TaskEndpoint {
  post: string;
  get: string;
}

export interface RunTaskOptions {
  download?: boolean;
  output?: string;
  open?: boolean;
  label?: string;
  maxWait?: number;
}

/**
 * Generic async task runner that handles the common pattern:
 * POST to create task -> poll for completion -> download results.
 *
 * Used by upscale, relight, expand, style-transfer, reimagine,
 * icon, music, sfx, video, and others.
 */
export async function runAsyncTask(
  endpoint: TaskEndpoint,
  body: Record<string, unknown>,
  opts: RunTaskOptions,
): Promise<string[]> {
  if (opts.label) {
    info(opts.label);
  }

  const res = await post<TaskCreateResponse>(endpoint.post, body);

  if (globals.json) {
    printJson(res);
    return [];
  }

  const taskId = res.data.task_id;
  info(`Task created: ${taskId}`);

  if (opts.download === false) {
    info(`Check status with: freepik status ${taskId} --endpoint ${endpoint.get}`);
    return [];
  }

  const result = await pollTask(endpoint.get, taskId, {
    silent: globals.json,
    maxWait: opts.maxWait,
  });

  if (globals.json) {
    printJson(result.raw);
    return [];
  }

  const paths = await downloadGenerated(result.generated, opts.output, globals.verbose);

  if (opts.open && paths.length > 0) {
    openFile(paths[0]);
  }

  return paths;
}
