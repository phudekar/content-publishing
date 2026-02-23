# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Content Publishing is a TypeScript CLI tool that generates PDF documents and static HTML websites from Markdown content organized as hierarchical books (Book → Units → Pages). It uses Bun as the runtime/package manager.

## Commands

```bash
# Install dependencies
bun install

# Build (tsup bundler, outputs to dist/)
bun run build

# Dev mode (watch)
bun run dev

# Run all tests (Vitest)
bun test

# Run a single test file
bun test tests/parser.test.ts

# Run tests in watch mode
bun test:watch

# CLI usage (after build)
bun ./dist/cli.js validate --book-dir ./examples/de-roadmap
bun ./dist/cli.js build site --book-dir ./examples/de-roadmap -o _site
bun ./dist/cli.js build pdf --book-dir ./examples/de-roadmap -o output.pdf

# Example site shortcuts
bun run example:build    # Build CLI + generate DE roadmap site to _site/
bun run example:serve    # Build + serve at http://localhost:3000
```

No linter/formatter is currently configured.

## Architecture

The system follows a pipeline architecture: CLI → Config Loading → Markdown Parsing → Rendering (Site or PDF).

### Pipeline Flow (`src/pipeline.ts`)
1. Load and validate book config from `book.yaml` using Zod schemas
2. Parse Markdown pages (frontmatter extraction via gray-matter, rendering via markdown-it, syntax highlighting via Shiki)
3. Render output via either the site generator (Nunjucks templates → static HTML) or PDF generator (Puppeteer headless Chrome)

### Key Source Directories
- **`src/config/`** — Zod schemas (`schema.ts`) and YAML book structure loader (`loader.ts`). Book config is hierarchical: `book.yaml` → `_unit.yaml` per unit → Markdown pages with YAML frontmatter.
- **`src/parser/`** — Markdown processing. `directives.ts` defines custom markdown-it-container blocks: `:::goal`, `:::deliverables`, `:::diagram` (Mermaid), `:::cheat` (pipe-delimited tables). `nodes.ts` defines IR node types for extensible transforms.
- **`src/renderer/`** — `site.ts` generates static HTML with Nunjucks templates (breadcrumbs, pagination across units). `pdf.ts` generates PDFs via Puppeteer with Mermaid diagram support.
- **`src/templates/`** — Nunjucks templates (`base.njk`, `index.njk`, `unit.njk`, `page.njk`, `pdf.njk`) and `assets/style.css`.

### Content Structure
Books are directories containing:
- `book.yaml` — Title, author, unit list, PDF/site config
- `unit-XX-name/_unit.yaml` — Unit title, order, page list
- `unit-XX-name/NN-page-name.md` — Pages with YAML frontmatter (`title`, `tags`)

See `examples/de-roadmap/` for a complete example and `tests/fixtures/sample-book/` for test fixtures.

### Build Configuration
- **Module system**: ESM (`"type": "module"`)
- **TypeScript**: Strict mode, ES2022 target, bundler module resolution
- **tsup**: Bundles `src/cli.ts` (with shebang) and `src/index.ts`, targets Node.js 20
- **Vitest**: 30-second test timeout, globals enabled
