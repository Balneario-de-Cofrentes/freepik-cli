import { exec } from 'node:child_process';
import { platform } from 'node:os';

function getOpenCommand(): string {
  switch (platform()) {
    case 'darwin':
      return 'open';
    case 'win32':
      return 'start';
    default:
      return 'xdg-open';
  }
}

export function openFile(path: string): void {
  const cmd = getOpenCommand();
  exec(`${cmd} "${path}"`);
}

export function openUrl(url: string): void {
  const cmd = getOpenCommand();
  exec(`${cmd} "${url}"`);
}
