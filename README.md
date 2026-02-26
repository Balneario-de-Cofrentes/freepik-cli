# freepik-cli

The missing CLI for the Freepik API. Generate images, videos, icons, music, and more from your terminal.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E%3D%2018-brightgreen)](https://nodejs.org/)

## Why freepik-cli?

The Freepik API is async: most operations require a POST, repeated polling until completion, then downloading the result. When called from an LLM agent, each of those steps costs tokens and inference time. The CLI collapses the entire sequence into one deterministic command. See [For AI Agents](#for-ai-agents) for the full breakdown.

| Feature | freepik-cli | Freepik MCP (official) | Direct API (curl/fetch) |
|---------|------------|----------------------|----------------------|
| **LLM turns per operation** | 1 (single command) | 3-5 (poll loop + download) | 3-5 (same, manual) |
| **Tokens per operation** | ~110 | ~2700+ | ~2700+ |
| **Determinism** | CLI handles all steps | Agent decides each step | Agent decides each step |
| **API coverage** | 23 commands (all endpoints) | 4 tools (Mystic, icons, resources, classify) | All endpoints (manual) |
| **Image models** | 11 models with named aliases | Mystic only | All (raw endpoint paths) |
| **Video generation** | 5 models (Kling, Hailuo, Wan) | Not supported | All (manual polling) |
| **Audio** | Music + sound effects | Not supported | All (manual polling) |
| **Image editing** | Upscale, remove-bg, expand, relight, style-transfer | Not supported | All (manual polling) |
| **Async task polling** | Automatic (waits + downloads) | Handled by MCP for Mystic | Manual (build your own) |
| **File download** | Automatic to disk | Returns URLs (agent decides) | Manual download |
| **Image input** | Local files or URLs (auto base64) | Depends on agent | Manual base64 encoding |
| **Batch operations** | `--count N` or `batch manifest.json` | One call at a time | Build your own |
| **Smart model selection** | `--smart` auto-picks best model | N/A (Mystic only) | N/A |
| **Cost tracking** | `freepik history --total-cost` | None | None |
| **Rate limit visibility** | `freepik credits` | None | Parse headers yourself |
| **JSON output** | `--json` flag on every command | Native (structured MCP responses) | Native JSON |
| **Offline bg removal** | `--local` flag (uses rembg) | Not available | Not available |
| **Works without LLM** | Yes (standalone CLI + shell scripts) | Requires MCP runtime | Yes |

## Features

- **23 Commands**: Cover all Freepik API endpoints (generation, editing, video, audio, and more)
- **11 Image Models**: 6 free tiers (Flux, Hyperflux, Seedream) + 5 premium (Mystic, Flux Pro, Runway)
- **Smart Model Selection**: Automatically picks the best model based on your prompt with `--smart`
- **Batch Generation**: Generate multiple images in parallel with `--count N`
- **Prompt Templates**: 7 pre-built templates for common use cases
- **Generation History**: Track costs and manage all generated assets locally
- **Auto-View Results**: Open images automatically with `--open`
- **Zero Runtime Dependencies**: Only Commander.js (83.9KB single-file bundle)
- **TypeScript**: Full type safety and first-class IntelliSense
- **Async Task Polling**: Handles long-running operations with automatic retry

## Requirements

- **Node.js** >= 18
- **Freepik API Key** (get one free at https://www.freepik.com/api)

## Installation

### From Source

```bash
git clone https://github.com/Balneario-de-Cofrentes/freepik-cli.git
cd freepik-cli
pnpm install
pnpm build
pnpm link --global
```

The first run triggers interactive setup to store your API key.

## Quick Start

### Set Up Your API Key

```bash
freepik config set-key YOUR_API_KEY
```

Or use an environment variable:

```bash
export FREEPIK_API_KEY=YOUR_API_KEY
```

Config is stored at `~/.config/freepik-cli/config.json`.

### Generate Your First Image

```bash
freepik generate "a tiny robot reading a book in a cozy library" -o robot.png
```

That's it. The CLI handles API polling and downloads automatically.

## For AI Agents

### CLI vs MCP vs Direct API: Token Cost and Determinism

The Freepik API is async: most operations require POST, then repeated polling, then downloading the result. How you interface with that pipeline has a real impact on cost and reliability when called from an LLM agent.

**MCP or direct API (multi-step, non-deterministic):**

Each step requires a full LLM inference round. The agent reasons about what to call, generates parameters, receives the response, then reasons again about the next step.

```
Turn 1: Agent reasons + generates MCP/API call      → ~500 tokens out
Turn 1: Receives task_id + metadata                  → ~300 tokens in
Turn 2: Agent reasons "I need to poll" + polls       → ~400 tokens out
Turn 2: Receives "status: PENDING"                   → ~200 tokens in
Turn 3: Agent polls again                            → ~400 tokens out
Turn 3: Receives "status: COMPLETED" + URL           → ~500 tokens in
Turn 4: Agent reasons "I need to download" + fetches → ~400 tokens out
         ─────────────────────────────────────────
         Total: 4+ LLM turns, ~2700+ tokens
```

Each turn adds LLM inference latency (seconds) on top of API latency. And at every turn the agent can make a mistake: wrong parameters, premature polling, forgetting to download, misinterpreting an error.

**CLI (single invocation, deterministic):**

```
Turn 1: Agent generates one shell command             → ~80 tokens out
         freepik generate "prompt" --model mystic -o output.png
         (internally: POST → poll → poll → download → done)
Turn 1: Receives "Saved to output.png"                → ~30 tokens in
         ─────────────────────────────────────────
         Total: 1 LLM turn, ~110 tokens
```

All polling, downloading, base64 encoding, and error handling happen inside the CLI process. Zero tokens spent on that logic. The LLM's only job is to construct the right command.

**Comparison:**

| | MCP / Direct API | CLI |
|---|---|---|
| LLM turns per operation | 3-5 | 1 |
| Tokens consumed | ~2700+ | ~110 |
| Points where the LLM can fail | Every turn | Only the initial command |
| Total latency | (N turns x inference) + API | (1 turn x inference) + API |
| Determinism | Agent decides each step | CLI executes the same way every time |

This multiplies with scale. 10 images via MCP means 30-50 LLM turns. With `freepik batch manifest.json`, it's still 1 turn.

The general principle: any API that requires polling or multi-step orchestration is better wrapped in a CLI than exposed as individual MCP tools or raw API calls. The CLI converts non-deterministic multi-step operations into a single deterministic invocation.

### Agent Examples

```bash
# One command = complete operation (POST + poll + download)
freepik generate "product photo of wireless earbuds on marble surface" -o earbuds.png

# Let the CLI pick the model so the agent doesn't have to
freepik generate "professional corporate team photo" --smart -o team.png

# Structured output for programmatic pipelines
freepik generate "modern logo concept" --json | jq -r '.data.generated[0].path'

# Batch: 4 images, 3 concurrent, 1 LLM turn instead of 12-20
freepik batch marketing-assets.json --concurrency 3

# Multi-step pipeline, still deterministic (no LLM reasoning between steps)
freepik generate "raw product photo" -o raw.png && \
freepik upscale raw.png --scale 4x -o upscaled.png && \
freepik remove-bg upscaled.png -o final.png

# Video with automatic polling (would be 5+ MCP turns)
freepik video --prompt "product demo walkthrough" --model wan-2.5-t2v -o demo.mp4
```

### Quick Model Reference for Agents

Select the right model for your task:

| Model | Cost | Speed | Best For | Keywords |
|-------|------|-------|----------|----------|
| **mystic** | Medium | Medium | Ultra-realistic portraits, photography | portrait, headshot, photorealistic, realistic |
| **flux-2-pro** | Medium | Medium | Professional creative work, complex scenes | professional, complex, creative, detailed |
| **flux-2-turbo** | Low | Fast | Balanced default choice | general purpose, quick iterations |
| **flux-2-klein** | Low | Ultra-fast | Lightweight rapid iterations | quick, simple, fast |
| **hyperflux** | Low | Ultra-fast | Logos, minimal designs, icons | logo, minimal, icon, simple |
| **seedream-4** | Low | Fast | General purpose, diverse styles | general, varied |
| **seedream-4.5** | Low | Fast | Enhanced general purpose | general, enhanced |
| **flux-dev** | Low | Medium | Illustrations with styling effects | illustration, artistic, stylized |
| **flux-kontext** | Medium | Medium | Context-aware multi-element generation | complex, multi-element, contextual |
| **flux-pro-1.1** | Medium | Medium | Professional-grade output | professional, production, premium |
| **runway** | Medium | Medium | Cinematic, creative work | cinematic, creative, dramatic |

### Use `--smart` to Remove Decision-Making

Let the CLI analyze prompts and select the best model automatically:

```bash
# CLI detects "professional", "headshot" -> selects Mystic
freepik generate "professional corporate headshot" --smart -o photo.png

# CLI detects "logo" -> selects Hyperflux
freepik generate "tech startup logo design" --smart -o logo.png

# CLI detects "illustration" -> selects Flux Dev
freepik generate "fantasy character illustration, watercolor style" --smart -o character.png
```

## Usage Examples

### Image Generation

```bash
# Use smart model selection (analyzes your prompt)
freepik generate "professional portrait" --smart -o portrait.png

# Specify a model explicitly
freepik generate "abstract art" -m flux-dev --style "watercolor" -o art.png

# Generate 5 variations in parallel
freepik generate "logo concept" --count 5 -o "logo-{n}.png"

# Generate in 4K
freepik generate "detailed landscape" --resolution 4k -o landscape.png

# Custom aspect ratio
freepik generate "movie poster" --aspect 16:9 -o poster.png

# E-commerce product photos
freepik generate "professional product photo of running shoes on white background, studio lighting" --smart -o shoes.png

# Generate 10 product variations (different angles/colors)
freepik generate "luxury handbag product photography, different colors and angles" --count 10 -o "handbag-{n}.png"

# Social media content (Instagram square)
freepik generate "minimalist coffee shop interior, warm lighting, aesthetic" --aspect 1:1 -o instagram-post.png

# Website hero banner
freepik generate "modern tech company office with diverse team collaborating" --aspect 16:9 --resolution 4k -o hero.png

# App icon and UI assets
freepik generate "minimalist app icon for weather application, flat design" --aspect 1:1 -m hyperflux -o app-icon.png

# Multiple icon styles for the same concept
freepik generate "calendar icon design" --count 5 --style "flat, modern, minimal" -o "icon-{n}.png"

# Marketing collateral
freepik generate "luxury watch product lifestyle shot, elegant background, professional photography" --smart -o marketing.png

# Blog post featured image
freepik generate "artificial intelligence transforming business, abstract concept, modern design" --aspect 16:9 -o blog-featured.png
```

### Video Generation

```bash
# Text-to-video
freepik video --prompt "waves crashing on sunset beach" --model wan-2.5-t2v -o ocean.mp4

# Image-to-video (animate an existing image)
freepik video --image photo.jpg --model kling-2.6-pro --prompt "camera zoom in" -o video.mp4

# Product demo video
freepik video --prompt "smartphone app interface walkthrough, smooth transitions, professional" --model wan-2.5-t2v -o app-demo.mp4

# Marketing teaser video
freepik video --prompt "luxury car driving through neon city at night, cinematic, high speed" --model runway -o teaser.mp4

# Social media short-form video
freepik video --prompt "trending dance move, energetic, vibrant background" --model kling-2.6-pro -o social-short.mp4

# Animate a product photo
freepik video --image product.png --prompt "product rotating slowly with studio lighting" --model kling-2.6-pro -o product-animation.mp4

# Nature/travel B-roll
freepik video --prompt "drone footage flying over mountain landscape, sunrise lighting" --model wan-2.5-t2v -o broll.mp4
```

### Image Editing

```bash
# Upscale 2x or 4x
freepik upscale photo.jpg --scale 2x -o photo-2x.png

# Remove background
freepik remove-bg product.jpg -o product-clean.png

# Expand canvas
freepik expand landscape.jpg --top 100 --bottom 100 -o expanded.png

# Adjust lighting
freepik relight photo.jpg --lighting "warm sunset" -o relit.png

# Apply artistic style
freepik style-transfer photo.jpg --style "oil painting" -o styled.png

# Image processing pipeline (chained operations)
freepik upscale photo.jpg --scale 4x -o upscaled.png && \
freepik remove-bg upscaled.png -o clean.png && \
freepik relight clean.png --lighting "studio professional" -o final.png

# Product image processing
freepik remove-bg product-raw.jpg -o product.png && \
freepik upscale product.png --scale 2x -o product-hires.png

# Enhance low-quality image
freepik upscale old-photo.jpg --scale 2x -o enhanced.png && \
freepik relight enhanced.png --lighting "warm vintage" -o vintage.png

# Creative styling workflow
freepik relight portrait.jpg --lighting "golden hour" -o lit.png && \
freepik style-transfer lit.png --style "impressionist painting" -o artistic.png

# Expand canvas for social media
freepik expand landscape.jpg --top 150 --bottom 150 -o vertical.png

# Background removal for e-commerce
for img in products/*.jpg; do
  freepik remove-bg "$img" -o "clean/$(basename "$img")"
done
```

### Other Capabilities

```bash
# Generate icons (PNG or SVG)
freepik icon "shopping cart" --style filled --format svg -o cart.svg

# Generate music
freepik music "chill lofi beat, 90bpm, jazzy chords" -o lofi.mp3

# Sound effects
freepik audio "door creaking, horror movie style" -o creak.mp3

# Detect AI-generated images
freepik classify suspicious.jpg

# Reimagine an image in a new style
freepik reimagine photo.jpg --style "cyberpunk" -o reimagined.png

# Describe what's in an image
freepik describe photo.jpg

# View generation history
freepik history list --format table
```

## Image Models Comparison

| Model | Speed | Quality | Tier | Best For |
|-------|-------|---------|------|----------|
| **Mystic** | Medium | Excellent | Premium | Ultra-realistic portraits and photography |
| **Flux 2 Pro** | Medium | Very Good | Premium | Professional creative work |
| **Flux 2 Turbo** | Fast | Good | Free | Default, balanced choice |
| **Flux 2 Klein** | Ultra-fast | Good | Free | Lightweight, rapid iterations |
| **Flux Dev** | Medium | Very Good | Free | Illustrations, supports styling effects |
| **Flux Kontext** | Medium | Very Good | Premium | Context-aware generation |
| **Flux Pro 1.1** | Medium | Very Good | Premium | Professional-grade output |
| **Hyperflux** | Ultra-fast | Good | Free | Sub-second logo/minimal designs |
| **Seedream 4** | Fast | Good | Free | General purpose, ByteDance model |
| **Seedream 4.5** | Fast | Very Good | Free | Enhanced Seedream variant |
| **Runway** | Medium | Excellent | Premium | Cinematic, creative work |

## Commands Overview

### Generation & Creation

- `generate` - Text-to-image generation (23 models across 4 categories)
- `video` - Text/image-to-video (5 models)
- `icon` - Text-to-icon (5 styles: outline, filled, gradient, 3d, neon)
- `music` - Music generation with genre/tempo/mood control
- `audio` (sfx) - Sound effects generation

### Image Editing

- `upscale` - Enlarge images up to 16x with AI enhancement
- `remove-bg` - Remove backgrounds while preserving detail
- `expand` - Extend canvas in any direction with AI-generated content
- `relight` - Adjust lighting and atmosphere
- `style-transfer` - Apply artistic styles to images
- `reimagine` - Regenerate image in a different style

### Analysis & Utilities

- `classify` - Detect if image is AI-generated (with confidence)
- `describe` - Convert image to detailed text prompt
- `search` - Search Freepik library directly
- `lora` - Train and manage custom LoRA models

### Management

- `config` - API key setup, default model preferences
- `credits` - View account credits and tier info
- `history` - Browse generations, costs, and files
- `batch` - Batch process multiple prompts
- `models` - List all available models and details
- `templates` - Show prompt templates and examples
- `status` - Check API health and rate limits
- `open` - View a generated file (opens in default app)

## Smart Features

### Auto Model Selection

Let the CLI choose the best model based on your prompt:

```bash
freepik generate "professional headshot" --smart
# Detects "professional", "headshot" → selects Mystic model
# Explains: "portrait, realistic"
```

Rules include keywords for portraits, logos, illustrations, and commercial use.

### Batch Generation

Generate multiple images in parallel:

```bash
freepik generate "coffee cup design" --count 10 -o "cup-{n}.png"
```

### Prompt Templates

Built-in templates for common scenarios:

```bash
freepik generate --template product-photo
# Expands to optimized prompt for product photography
```

See all with: `freepik templates list`

### Auto-Open Results

View generated images immediately:

```bash
freepik generate "landscape" --open
```

### Generation History

Track all generations, costs, and find files:

```bash
freepik history list --format table
freepik history cost --model mystic  # See costs by model
```

## Scripting & Automation

Use freepik-cli in shell scripts and automation workflows for repeatable asset generation, batch processing, and CI/CD pipelines.

### Generate Landing Page Assets

```bash
# Generate a complete set of images for a landing page
sections=("hero" "features" "testimonials" "cta" "footer")

for section in "${sections[@]}"; do
  echo "Generating ${section} image..."
  freepik generate \
    "professional ${section} section image for SaaS landing page, modern design, high quality" \
    -m flux-2-pro \
    --aspect 16:9 \
    -o "landing-${section}.png"
done

echo "All landing page assets generated!"
```

### Batch Process Image Directory

```bash
# Upscale all images in a directory
mkdir -p processed

for img in raw/*.jpg; do
  output="processed/$(basename "${img%.*}-2x.png")"
  echo "Processing: $img -> $output"
  freepik upscale "$img" --scale 2x -o "$output"
done

echo "Batch upscaling complete!"
```

### Generate and Immediately Use Output

```bash
# Generate image and capture the file path for further processing
OUTPUT=$(freepik generate "test image" -o test.png 2>&1 | grep -oP 'Saved to \K.*' || echo "test.png")
echo "Generated image at: $OUTPUT"

# Use the output in subsequent operations
if [ -f "$OUTPUT" ]; then
  freepik remove-bg "$OUTPUT" -o "${OUTPUT%.*}-clean.png"
  echo "Background removed successfully"
fi
```

### Programmatic JSON Output for Pipelines

```bash
# Get structured JSON output for machine-readable processing
result=$(freepik generate "logo concept" --json 2>/dev/null)

# Extract information with jq
image_path=$(echo "$result" | jq -r '.data.generated[0].path // empty')
task_id=$(echo "$result" | jq -r '.data.task_id // empty')
credits_used=$(echo "$result" | jq -r '.data.credits_used // empty')

if [ -n "$image_path" ]; then
  echo "Generated: $image_path"
  echo "Task ID: $task_id"
  echo "Credits used: $credits_used"
fi
```

### Generate Product Photos for E-commerce

```bash
# Automated product photo generation and processing

products=("sneakers" "watch" "headphones" "backpack" "camera")

for product in "${products[@]}"; do
  echo "Generating product photos for: $product"

  # Generate 3 product photos
  freepik generate \
    "professional product photography of ${product}, white background, studio lighting, high quality" \
    --count 3 \
    --smart \
    -o "products/${product}-{n}.png"

  # Process each generated image (remove-bg, upscale)
  for img in products/${product}-*.png; do
    freepik remove-bg "$img" -o "${img%.*}-clean.png"
    freepik upscale "${img%.*}-clean.png" --scale 2x -o "${img%.*}-hires.png"
  done
done

echo "Product photography workflow complete!"
```

### CI/CD Integration (Generate Assets on Deploy)

```bash
#!/bin/bash
# Generate marketing assets as part of deployment pipeline

set -e

echo "Generating deployment assets..."

# Check API credentials
freepik credits || exit 1

# Generate hero image
freepik generate "modern product hero image for deployment" --smart -o "hero.png"

# Generate social preview
freepik generate "social media preview image, 1200x630" --aspect 16:9 -o "social-preview.png"

# Process for web (multiple sizes)
freepik upscale hero.png --scale 1x -o hero-web.png
freepik upscale social-preview.png --scale 1x -o social-web.png

# Verify outputs
test -f hero-web.png || exit 1
test -f social-web.png || exit 1

echo "Assets generated successfully!"
exit 0
```

### Cost Tracking and Reporting

```bash
# Generate report of generation costs by model

echo "=== Generation Cost Report ==="
freepik history list --format json | jq -r '.[] | "\(.model): \(.credits_used) credits"' | sort | uniq -c

# Get total credits used
total=$(freepik history list --format json | jq 'map(.credits_used) | add')
echo "Total credits used: $total"

# Check remaining credits
freepik credits
```

### Watch for API Failures and Retry

```bash
# Retry logic for unreliable network conditions

retry_count=0
max_retries=3

while [ $retry_count -lt $max_retries ]; do
  if freepik generate "image prompt" -o output.png; then
    echo "Success!"
    exit 0
  else
    retry_count=$((retry_count + 1))
    echo "Attempt $retry_count failed. Retrying..."
    sleep 2
  fi
done

echo "Failed after $max_retries attempts"
exit 1
```

## Configuration

### API Key Management

```bash
# Set (one-time, then stored locally)
freepik config set-key YOUR_API_KEY

# View (masked)
freepik config get-key

# Set default model
freepik config set-model flux-dev

# Show entire config
freepik config show
```

Location: `~/.config/freepik-cli/config.json`

### Global Options (All Commands)

```bash
freepik <command> [options]

# Enable verbose logging
freepik generate "prompt" --verbose

# Output raw JSON (for scripting)
freepik generate "prompt" --json

# Custom API key (overrides config)
freepik generate "prompt" --api-key YOUR_KEY

# Custom polling interval (milliseconds)
freepik generate "prompt" --poll-interval 2000
```

## Architecture

freepik-cli is engineered for performance and simplicity:

- **TypeScript + ESM**: Modern, type-safe code
- **Commander.js**: Robust CLI argument parsing
- **Native Fetch**: No HTTP library bloat
- **Zero Runtime Dependencies**: Only Commander (besides Node.js builtins)
- **83.9KB Bundle**: Single compiled file, instant startup
- **Async Task Polling**: Handles multi-minute operations elegantly

## API Documentation

Full Freepik API reference: https://docs.freepik.com

## Troubleshooting

### "Invalid or missing API key"

```bash
freepik config set-key YOUR_API_KEY
# or
export FREEPIK_API_KEY=YOUR_API_KEY
```

### Rate Limiting

If you hit API rate limits, increase polling interval:

```bash
freepik generate "..." --poll-interval 5000
```

### File Already Exists

Overwrite with:

```bash
freepik generate "..." -o file.png --force
```

### Enable Debug Logging

See API requests and responses:

```bash
freepik generate "..." --verbose
```

## Contributing

Contributions welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Install dependencies: `pnpm install`
4. Build: `pnpm build`
5. Test locally: `pnpm link --global && freepik --help`
6. Commit and push: `git push origin feature/my-feature`
7. Open a pull request

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Support

- **GitHub Issues**: https://github.com/Balneario-de-Cofrentes/freepik-cli/issues
- **Freepik API Support**: https://support.freepik.com
- **API Documentation**: https://docs.freepik.com

---

With love from the tech team at [Balneario de Cofrentes](https://balneario.com) - the largest longevity clinic.
