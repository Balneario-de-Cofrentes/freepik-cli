import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { loadConfig, saveConfig, getConfigPath, maskApiKey } from './config.js';
import { c, info, success, error } from './output.js';

const API_KEY_URL = 'https://www.freepik.com/api';

async function prompt(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  const answer = await rl.question(question);
  return answer.trim();
}

/**
 * Validate an API key by making a lightweight request to the Freepik API.
 * We use the classifier endpoint with an empty body - it returns 400 (bad params)
 * if the key is valid, or 401 if the key is invalid.
 */
async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.freepik.com/v1/ai/text-to-image/flux-2-turbo', {
      method: 'GET',
      headers: { 'x-freepik-api-key': apiKey },
    });
    // 200 = valid key (lists tasks), 401 = invalid key
    return res.status !== 401;
  } catch {
    return false;
  }
}

/**
 * Check whether onboarding is needed (no API key configured anywhere).
 */
export async function needsOnboarding(): Promise<boolean> {
  if (process.env.FREEPIK_API_KEY) return false;
  const config = await loadConfig();
  return !config.apiKey;
}

/**
 * Interactive onboarding flow for first-time users.
 */
export async function runOnboarding(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    console.log();
    console.log(`${c.bold}Welcome to freepik-cli${c.reset}`);
    console.log(`Generate images, videos, icons, music, and more from your terminal.`);
    console.log();

    // Step 1: API Key
    console.log(`${c.cyan}1.${c.reset} ${c.bold}API Key${c.reset}`);
    console.log(`   You need a Freepik API key to get started.`);
    console.log(`   Get one at: ${c.cyan}${API_KEY_URL}${c.reset}`);
    console.log();

    let apiKey = '';
    while (!apiKey) {
      apiKey = await prompt(rl, `   Paste your API key: `);
      if (!apiKey) {
        error('API key is required to continue.');
        continue;
      }

      // Validate the key
      info('Validating API key...');
      const valid = await validateApiKey(apiKey);
      if (!valid) {
        error('Invalid API key. Please check and try again.');
        apiKey = '';
      }
    }
    success(`API key is valid (${maskApiKey(apiKey)})`);
    console.log();

    // Step 2: Output directory
    console.log(`${c.cyan}2.${c.reset} ${c.bold}Default output directory${c.reset}`);
    console.log(`   Generated files will be saved here when you don't specify -o.`);
    console.log(`   Current default: ${c.dim}./${c.reset} (current working directory)`);
    console.log();

    const outputDir = await prompt(rl, `   Output directory (press Enter to keep ./): `);
    console.log();

    // Step 3: Default model
    console.log(`${c.cyan}3.${c.reset} ${c.bold}Default image model${c.reset}`);
    console.log(`   Available models:`);
    console.log(`   ${c.dim}flux-2-turbo${c.reset}  - Fast, good quality ${c.green}(recommended)${c.reset}`);
    console.log(`   ${c.dim}mystic${c.reset}        - Ultra-realistic, Freepik flagship`);
    console.log(`   ${c.dim}hyperflux${c.reset}     - Ultra-fast, sub-second`);
    console.log(`   ${c.dim}flux-2-pro${c.reset}    - Professional grade`);
    console.log(`   ${c.dim}seedream-4.5${c.reset}  - Fast, high quality`);
    console.log(`   ${c.dim}...and 6 more${c.reset}`);
    console.log();

    const defaultModel = await prompt(rl, `   Default model (press Enter for flux-2-turbo): `);
    console.log();

    // Save config
    const config = await loadConfig();
    config.apiKey = apiKey;
    if (outputDir) config.outputDir = outputDir;
    if (defaultModel) config.defaultModel = defaultModel;
    await saveConfig(config);

    // Save the onboarding timestamp so we can show the star nudge later
    config.onboardedAt = Date.now();
    await saveConfig(config);

    // Summary
    console.log(`${c.green}${c.bold}Setup complete!${c.reset}`);
    console.log(`Config saved to: ${c.dim}${getConfigPath()}${c.reset}`);
    console.log();
    console.log(`${c.bold}Try it out:${c.reset}`);
    console.log(`  ${c.cyan}freepik generate "a sunset over mountains" -o sunset.png${c.reset}`);
    console.log(`  ${c.cyan}freepik generate --help${c.reset}`);
    console.log();
  } finally {
    rl.close();
  }
}
