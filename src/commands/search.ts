import { Command } from 'commander';
import { globals } from '../lib/globals.js';
import { get } from '../lib/api.js';
import { ENDPOINTS } from '../lib/models.js';
import { info, error, printJson, c } from '../lib/output.js';
import type { SearchOptions } from '../types.js';

interface SearchResult {
  id: number;
  title: string;
  url: string;
  author?: { name?: string };
  downloads?: number;
  type?: string;
  [key: string]: unknown;
}

interface SearchResponse {
  data: SearchResult[];
  meta?: {
    pagination?: {
      total?: number;
      current_page?: number;
      last_page?: number;
    };
  };
  [key: string]: unknown;
}

export function registerSearchCommand(program: Command): void {
  program
    .command('search')
    .description('Search Freepik stock content')
    .argument('<query>', 'Search query')
    .option('--page <n>', 'Page number', '1')
    .option('--limit <n>', 'Results per page (1-100)', '10')
    .option('--order <order>', 'Sort order (relevance, recent)', 'relevance')
    .option('--orientation <o>', 'Filter by orientation (landscape, portrait, square)')
    .option('--type <type>', 'Content type (photo, psd, vector)')
    .option('--license <license>', 'License type (freemium, premium)')
    .option('--ai-generated', 'Filter for AI-generated content only')
    .addHelpText('after', `
Examples:
  $ freepik search "business meeting"
  $ freepik search "sunset landscape" --type photo --orientation landscape
  $ freepik search "vector icons" --type vector --limit 20
  $ freepik search "premium backgrounds" --license premium --page 2
  $ freepik search "AI art" --ai-generated --order recent
  $ freepik search "cat" --json | jq '.data[].id'              # Agent: extract IDs`)
    .action(async (query: string, opts: SearchOptions) => {
      try {
        info(`Searching: "${query}"`);

        // Build query params
        const params = new URLSearchParams();
        params.set('term', query);
        params.set('page', opts.page ?? '1');
        params.set('limit', opts.limit ?? '10');
        if (opts.order) params.set('order', opts.order);
        if (opts.orientation) params.set('filters[orientation][photo]', opts.orientation);
        if (opts.type) params.set('filters[content_type][photo]', opts.type === 'photo' ? '1' : '0');
        if (opts.license) params.set('filters[license][freemium]', opts.license === 'freemium' ? '1' : '0');
        if (opts.aiGenerated) params.set('filters[ai-generated]', '1');

        const url = `${ENDPOINTS.search}?${params.toString()}`;
        const res = await get<SearchResponse>(url);

        if (globals.json) {
          printJson(res);
          return;
        }

        const results = res.data ?? [];
        const total = res.meta?.pagination?.total ?? results.length;

        if (results.length === 0) {
          info('No results found.');
          return;
        }

        console.log();
        console.log(
          `${c.bold}Found ${total} results${c.reset} ${c.dim}(showing ${results.length})${c.reset}`,
        );
        console.log();

        // Table header
        const titleW = 40;
        const authorW = 16;
        const dlW = 10;
        console.log(
          `  ${c.dim}${'Title'.padEnd(titleW)}  ${'Author'.padEnd(authorW)}  ${'Downloads'.padEnd(dlW)}  URL${c.reset}`,
        );
        console.log(
          `  ${c.dim}${'-'.repeat(titleW)}  ${'-'.repeat(authorW)}  ${'-'.repeat(dlW)}  ${'-'.repeat(30)}${c.reset}`,
        );

        for (const item of results) {
          const title = (item.title ?? 'Untitled').slice(0, titleW).padEnd(titleW);
          const author = (item.author?.name ?? 'Unknown').slice(0, authorW).padEnd(authorW);
          const downloads = String(item.downloads ?? '-').padEnd(dlW);
          const itemUrl = item.url ?? '';
          console.log(`  ${title}  ${author}  ${downloads}  ${c.cyan}${itemUrl}${c.reset}`);
        }

        console.log();
        const page = Number(opts.page ?? 1);
        const lastPage = res.meta?.pagination?.last_page ?? 1;
        if (page < lastPage) {
          info(`Page ${page}/${lastPage}. Use --page ${page + 1} for next page.`);
        }
      } catch (err) {
        error((err as Error).message);
        process.exit(1);
      }
    });
}
