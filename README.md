# freepik-cli

The missing CLI for the Freepik API. Generate images, videos, icons, music, and more from your terminal.

[![npm version](https://img.shields.io/badge/npm-0.2.0-blue)](https://www.npmjs.com/package/freepik-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E%3D%2018-brightgreen)](https://nodejs.org/)

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

### Quick Try (No Install)

```bash
npx freepik-cli --help
```

### Global Install

```bash
npm install -g freepik-cli
# or
pnpm add -g freepik-cli
```

The first run triggers interactive setup to store your API key.

### From Source

```bash
git clone https://github.com/Balneario-de-Cofrentes/freepik-cli.git
cd freepik-cli
pnpm install
pnpm build
pnpm link --global
```

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
```

### Video Generation

```bash
# Text-to-video
freepik video --prompt "waves crashing on sunset beach" --model wan-2.5-t2v -o ocean.mp4

# Image-to-video (animate an existing image)
freepik video --image photo.jpg --model kling-2.6-pro --prompt "camera zoom in" -o video.mp4
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
