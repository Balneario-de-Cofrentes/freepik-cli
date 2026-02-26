import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { TEMPLATES } from '../lib/templates.js';
import { printJson, c } from '../lib/output.js';
import type { TemplatesOptions } from '../types.js';

export function registerTemplatesCommand(program: Command): void {
  program
    .command('templates')
    .description('List available prompt templates')
    .action(async (_opts: TemplatesOptions) => {
      if (globals.json) {
        printJson(TEMPLATES);
        return;
      }

      console.log();
      console.log(`${c.bold}Prompt Templates${c.reset}`);
      console.log();
      console.log(`${c.dim}Use with: freepik generate --template <name> --vars "key=value,key2=value2"${c.reset}`);
      console.log();

      for (const [name, template] of Object.entries(TEMPLATES)) {
        // Extract variable placeholders
        const vars = Array.from(template.matchAll(/\{(\w+)\}/g)).map((m) => m[1]);
        const uniqueVars = [...new Set(vars)];

        console.log(`  ${c.bold}${c.cyan}${name}${c.reset}`);
        console.log(`  ${c.dim}${template}${c.reset}`);
        if (uniqueVars.length > 0) {
          console.log(`  Variables: ${uniqueVars.map((v) => `{${v}}`).join(', ')}`);
        }
        console.log();
      }

      console.log(`${c.dim}Example: freepik generate --template product-photo --vars "product=sneakers" -o sneakers.png${c.reset}`);
      console.log();
    });
}
