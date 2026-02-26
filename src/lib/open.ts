import { execFile } from 'node:child_process';

function getOpenCommand(): string {
  switch (process.platform) {
    case 'darwin':
      return 'open';
    case 'win32':
      return 'start';
    default:
      return 'xdg-open';
  }
}

export function openFile(path: string): void {
  execFile(getOpenCommand(), [path], (err) => {
    if (err && process.env.NODE_ENV !== 'test') {
      console.error(`Could not open file: ${err.message}`);
    }
  });
}

export function openUrl(url: string): void {
  execFile(getOpenCommand(), [url], (err) => {
    if (err && process.env.NODE_ENV !== 'test') {
      console.error(`Could not open URL: ${err.message}`);
    }
  });
}
