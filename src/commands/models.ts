import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { MODEL_INFO } from '../lib/models.js';
import { printJson, c } from '../lib/output.js';
import type { ModelsOptions } from '../types.js';

export function registerModelsCommand(program: Command): void {
  program
    .command('models')
    .description('List all available models with details')
    .action(async (_opts: ModelsOptions) => {
      if (globals.json) {
        printJson(MODEL_INFO);
        return;
      }

      const nameW = 17;
      const speedW = 12;
      const qualityW = 12;
      const tierW = 10;

      function printTable(models: typeof MODEL_INFO[string][]): void {
        console.log(
          `  ${c.dim}${'Name'.padEnd(nameW)}  ${'Speed'.padEnd(speedW)}  ${'Quality'.padEnd(qualityW)}  ${'Tier'.padEnd(tierW)}  Notes${c.reset}`,
        );
        console.log(
          `  ${c.dim}${'-'.repeat(nameW)}  ${'-'.repeat(speedW)}  ${'-'.repeat(qualityW)}  ${'-'.repeat(tierW)}  ${'-'.repeat(30)}${c.reset}`,
        );

        for (const m of models) {
          const name = m.name.padEnd(nameW);
          const speed = m.speed.padEnd(speedW);
          const quality = m.quality.padEnd(qualityW);
          const tierColor = m.tier === 'Free' ? c.green : c.yellow;
          const tier = `${tierColor}${m.tier.padEnd(tierW)}${c.reset}`;
          console.log(`  ${name}  ${speed}  ${quality}  ${tier}  ${c.dim}${m.notes}${c.reset}`);
        }
      }

      const allModels = Object.values(MODEL_INFO);

      // Image Generation Models
      const imageModels = allModels.filter((m) => m.category === 'image');
      if (imageModels.length > 0) {
        console.log();
        console.log(`${c.bold}Image Generation Models:${c.reset}`);
        printTable(imageModels);
      }

      // Video Models
      const videoModels = allModels.filter((m) => m.category === 'video');
      if (videoModels.length > 0) {
        console.log();
        console.log(`${c.bold}Video Models:${c.reset}`);
        printTable(videoModels);
      }

      // Editing Tools
      const editingModels = allModels.filter((m) => m.category === 'editing');
      if (editingModels.length > 0) {
        console.log();
        console.log(`${c.bold}Editing Tools:${c.reset}`);
        printTable(editingModels);
      }

      console.log();
      console.log(`${c.dim}Use --json for machine-readable output.${c.reset}`);
      console.log();
    });
}
