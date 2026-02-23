# Content Publisher

Generate **PDF documents** and **static websites** from Markdown content organized as books.

## Quick Start

```bash
bun install
bun run build

# Generate a static site
publisher build site --book-dir ./examples/de-roadmap -o _site

# Generate a PDF
publisher build pdf --book-dir ./examples/de-roadmap -o output.pdf

# Validate a book
publisher validate --book-dir ./examples/de-roadmap
```

## Book Structure

```
my-book/
├── book.yaml                    # Book configuration
└── unit-01-topic/
    ├── _unit.yaml               # Unit configuration
    ├── 01-first-page.md         # Content pages
    └── 02-second-page.md
```

### `book.yaml`

```yaml
title: "My Book"
subtitle: "Optional subtitle"
author: "Author Name"
pdf:
  pageSize: A4
  cover: true
  margins: { top: 20, bottom: 20, left: 15, right: 15 }
site:
  syntaxTheme: github-dark
  baseUrl: /
units:
  - unit-01-topic
```

### `_unit.yaml`

```yaml
title: "Unit Title"
order: 1
pages:
  - 01-first-page
  - 02-second-page
```

### Page frontmatter

```yaml
---
title: "Page Title"
tags: [topic, subtopic]
---
```

## Custom Directives

```markdown
:::goal
Learning objective here.
:::

:::deliverables
- Item one
- Item two
:::

:::diagram
┌───┐    ┌───┐
│ A │───▶│ B │
└───┘    └───┘
:::

:::cheat
command | Description
another | Another description
:::
```

## Development

```bash
bun install
bun test          # Run tests
bun run build     # Build CLI
```

## Tech Stack

| Component | Tool |
|-----------|------|
| Runtime | Bun |
| Markdown | markdown-it + Shiki |
| HTML→PDF | Puppeteer |
| Templating | Nunjucks |
| Config | Zod |
| CLI | Commander.js |
| Tests | Vitest |
