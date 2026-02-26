/**
 * Global CLI state. Set during the preAction hook from the root command.
 * Commands read from here instead of their own opts for global flags.
 */
export const globals = {
  verbose: false,
  json: false,
};

export function setGlobals(opts: { verbose?: boolean; json?: boolean }): void {
  if (opts.verbose) globals.verbose = true;
  if (opts.json) globals.json = true;
}
