// ── ANSI color codes (no chalk dependency) ─────────────────────────
const ESC = '\x1b[';

export const c = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  gray: `${ESC}90m`,
};

export function colorize(color: string, text: string): string {
  return `${color}${text}${c.reset}`;
}

// ── Simple helpers ──────────────────────────────────────────────────
export function info(msg: string): void {
  console.log(`${c.cyan}i${c.reset} ${msg}`);
}

export function success(msg: string): void {
  console.log(`${c.green}\u2713${c.reset} ${msg}`);
}

export function warn(msg: string): void {
  console.log(`${c.yellow}!${c.reset} ${msg}`);
}

export function error(msg: string): void {
  console.error(`${c.red}\u2717${c.reset} ${msg}`);
}

export function debug(msg: string): void {
  console.log(`${c.gray}[debug]${c.reset} ${msg}`);
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

// ── Minimal spinner (no ora dependency) ─────────────────────────────
const SPINNER_FRAMES = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F'];

export interface Spinner {
  start(msg?: string): void;
  update(msg: string): void;
  stop(finalMsg?: string): void;
}

export function createSpinner(initialMsg: string = ''): Spinner {
  let frameIdx = 0;
  let interval: ReturnType<typeof setInterval> | null = null;
  let currentMsg = initialMsg;
  const startTime = Date.now();

  function render(): void {
    const frame = SPINNER_FRAMES[frameIdx % SPINNER_FRAMES.length];
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const line = `${c.cyan}${frame}${c.reset} ${currentMsg} ${c.gray}(${elapsed}s)${c.reset}`;
    process.stdout.write(`\r\x1b[K${line}`);
    frameIdx++;
  }

  return {
    start(msg?: string) {
      if (msg) currentMsg = msg;
      interval = setInterval(render, 80);
      render();
    },
    update(msg: string) {
      currentMsg = msg;
    },
    stop(finalMsg?: string) {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      process.stdout.write('\r\x1b[K');
      if (finalMsg) {
        console.log(finalMsg);
      }
    },
  };
}
