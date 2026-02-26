import { Command } from 'commander';
import { loadConfig, saveConfig, maskApiKey, getConfigPath } from '../lib/config.js';
import { info, success, error, c } from '../lib/output.js';

export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage CLI configuration');

  configCmd
    .command('set-key')
    .description('Set your Freepik API key')
    .argument('<api-key>', 'Your Freepik API key')
    .action(async (apiKey: string) => {
      try {
        const config = await loadConfig();
        config.apiKey = apiKey;
        await saveConfig(config);
        success(`API key saved (${maskApiKey(apiKey)})`);
        info(`Config file: ${getConfigPath()}`);
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });

  configCmd
    .command('set-output-dir')
    .description('Set the default output directory')
    .argument('<path>', 'Directory path for generated files')
    .action(async (path: string) => {
      try {
        const config = await loadConfig();
        config.outputDir = path;
        await saveConfig(config);
        success(`Default output directory set to: ${path}`);
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });

  configCmd
    .command('set-model')
    .description('Set the default generation model')
    .argument('<model>', 'Default model name (e.g. flux-2-turbo)')
    .action(async (model: string) => {
      try {
        const config = await loadConfig();
        config.defaultModel = model;
        await saveConfig(config);
        success(`Default model set to: ${model}`);
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });

  configCmd
    .command('show')
    .description('Show current configuration')
    .action(async () => {
      try {
        const config = await loadConfig();
        const envKey = process.env.FREEPIK_API_KEY;

        console.log(`${c.bold}Freepik CLI Configuration${c.reset}`);
        console.log(`Config file: ${c.dim}${getConfigPath()}${c.reset}`);
        console.log();

        if (envKey) {
          console.log(
            `  API Key (env):    ${c.green}${maskApiKey(envKey)}${c.reset} ${c.dim}(FREEPIK_API_KEY)${c.reset}`,
          );
        }
        if (config.apiKey) {
          console.log(
            `  API Key (config): ${c.green}${maskApiKey(config.apiKey)}${c.reset}`,
          );
        }
        if (!envKey && !config.apiKey) {
          console.log(`  API Key:          ${c.red}not set${c.reset}`);
        }

        console.log(
          `  Output Dir:       ${config.outputDir ?? c.dim + '.' + c.reset + ' (current directory)'}`,
        );
        console.log(
          `  Default Model:    ${config.defaultModel ?? c.dim + 'flux-2-turbo' + c.reset}`,
        );

        if (envKey) {
          console.log();
          info('Environment variable FREEPIK_API_KEY takes precedence over config file');
        }
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
