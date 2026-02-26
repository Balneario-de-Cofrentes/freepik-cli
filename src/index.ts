#!/usr/bin/env node

import { Command } from 'commander';
import { setVerbose } from './lib/api.js';
import { setGlobals } from './lib/globals.js';
import { needsOnboarding, runOnboarding } from './lib/onboarding.js';
import { registerGenerateCommand } from './commands/generate.js';
import { registerUpscaleCommand } from './commands/upscale.js';
import { registerRemoveBgCommand } from './commands/remove-bg.js';
import { registerExpandCommand } from './commands/expand.js';
import { registerRelightCommand } from './commands/relight.js';
import { registerStyleTransferCommand } from './commands/style-transfer.js';
import { registerVideoCommand } from './commands/video.js';
import { registerIconCommand } from './commands/icon.js';
import { registerMusicCommand } from './commands/music.js';
import { registerSfxCommand } from './commands/sfx.js';
import { registerClassifyCommand } from './commands/classify.js';
import { registerConfigCommand } from './commands/config.js';
import { registerStatusCommand } from './commands/status.js';
import { registerCreditsCommand } from './commands/credits.js';
import { registerReimagineCommand } from './commands/reimagine.js';
import { registerDescribeCommand } from './commands/describe.js';
import { registerSearchCommand } from './commands/search.js';
import { registerLoraCommand } from './commands/lora.js';
import { registerOpenCommand } from './commands/open.js';
import { registerBatchCommand } from './commands/batch.js';
import { registerHistoryCommand } from './commands/history.js';
import { registerModelsCommand } from './commands/models.js';
import { registerTemplatesCommand } from './commands/templates.js';

// Commands that should skip onboarding
const SKIP_ONBOARDING = ['config', 'help', 'models', 'templates', 'credits'];

async function main(): Promise<void> {
  // Run onboarding if no API key is configured,
  // unless the user is running config/help commands
  const args = process.argv.slice(2);
  const firstArg = args[0] ?? '';
  const isSkipped =
    SKIP_ONBOARDING.includes(firstArg) ||
    args.includes('--help') ||
    args.includes('-h') ||
    args.includes('--version') ||
    args.includes('-V');

  if (!isSkipped && await needsOnboarding()) {
    await runOnboarding();
    // After onboarding, if the user just ran `freepik` with no args, stop here
    if (args.length === 0) return;
  }

  const program = new Command();

  program
    .name('freepik')
    .description(
      'CLI tool for the Freepik API - generate images, videos, icons, music, and more',
    )
    .version('0.2.0')
    .option('--verbose', 'Enable verbose output for debugging')
    .option('--json', 'Output raw JSON responses')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.optsWithGlobals();
      setGlobals(opts);
      if (opts.verbose) {
        setVerbose(true);
      }
    });

  // Register all commands
  registerGenerateCommand(program);
  registerUpscaleCommand(program);
  registerRemoveBgCommand(program);
  registerExpandCommand(program);
  registerRelightCommand(program);
  registerStyleTransferCommand(program);
  registerReimagineCommand(program);
  registerDescribeCommand(program);
  registerVideoCommand(program);
  registerIconCommand(program);
  registerMusicCommand(program);
  registerSfxCommand(program);
  registerClassifyCommand(program);
  registerSearchCommand(program);
  registerLoraCommand(program);
  registerBatchCommand(program);
  registerOpenCommand(program);
  registerCreditsCommand(program);
  registerModelsCommand(program);
  registerTemplatesCommand(program);
  registerHistoryCommand(program);
  registerConfigCommand(program);
  registerStatusCommand(program);

  // Parse and run
  program.parse();
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
