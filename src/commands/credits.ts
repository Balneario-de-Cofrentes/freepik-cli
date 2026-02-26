import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { get, getLastRateLimit } from '../lib/api.js';
import { MODEL_INFO } from '../lib/models.js';
import { info, printJson, c } from '../lib/output.js';
import type { CreditsOptions } from '../types.js';

export function registerCreditsCommand(program: Command): void {
  program
    .command('credits')
    .description('Show API rate limits and model pricing')
    .action(async (_opts: CreditsOptions) => {
      try {
        // Make a lightweight GET request to trigger rate limit headers
        try {
          await get('/v1/ai/text-to-image/flux-2-turbo');
        } catch {
          // Even a 400/404 will give us rate limit headers
        }

        const rl = getLastRateLimit();

        if (globals.json) {
          printJson({ rateLimit: rl, models: MODEL_INFO });
          return;
        }

        console.log();
        console.log(`${c.bold}Freepik API Status${c.reset}`);

        if (rl.remaining !== null && rl.limit !== null) {
          console.log(`  Rate limit:    ${c.bold}${rl.remaining}/${rl.limit}${c.reset} requests remaining`);
          if (rl.reset !== null) {
            console.log(`  Resets in:     ${rl.reset} seconds`);
          }
        } else {
          console.log(`  Rate limit:    ${c.dim}(make a request first to see limits)${c.reset}`);
        }

        console.log();
        console.log(`${c.bold}Model Pricing (per generation):${c.reset}`);

        // Free tier
        console.log(`  ${c.green}Free tier models:${c.reset}`);
        for (const m of Object.values(MODEL_INFO)) {
          if (m.tier === 'Free' && m.category === 'image') {
            const padded = m.name.padEnd(17);
            console.log(`    ${padded}${c.dim}${m.costEstimate}${c.reset}`);
          }
        }

        // Premium image
        console.log();
        console.log(`  ${c.yellow}Premium models:${c.reset}`);
        for (const m of Object.values(MODEL_INFO)) {
          if (m.tier === 'Premium' && m.category === 'image') {
            const padded = m.name.padEnd(17);
            console.log(`    ${padded}${c.dim}${m.costEstimate}${c.reset}`);
          }
        }

        // Video
        console.log();
        console.log(`  ${c.magenta}Video models:${c.reset}`);
        for (const m of Object.values(MODEL_INFO)) {
          if (m.category === 'video') {
            const padded = m.name.padEnd(17);
            console.log(`    ${padded}${c.dim}${m.costEstimate}${c.reset}`);
          }
        }

        // Editing
        console.log();
        console.log(`  ${c.cyan}Editing:${c.reset}`);
        for (const m of Object.values(MODEL_INFO)) {
          if (m.category === 'editing') {
            const padded = m.name.padEnd(17);
            console.log(`    ${padded}${c.dim}${m.costEstimate}${c.reset}`);
          }
        }

        console.log();
      } catch (err) {
        // If we got rate limit info before the error, still show it
        const rl = getLastRateLimit();
        if (rl.remaining !== null) {
          info(`Rate limit: ${rl.remaining}/${rl.limit} remaining`);
        }
      }
    });
}
