import type MarkdownIt from "markdown-it";
import container from "markdown-it-container";

const DIRECTIVE_TYPES = ["goal", "deliverables", "diagram", "cheat"] as const;

function renderCheatTable(content: string): string {
  const rows = content
    .split("\n")
    .filter((line) => line.includes("|"))
    .map((line) => {
      const [cmd, desc] = line.split("|").map((s) => s.trim());
      return `<tr><td><code>${cmd}</code></td><td>${desc}</td></tr>`;
    })
    .join("\n");
  return `<table class="cheat-table">\n<thead><tr><th>Command</th><th>Description</th></tr></thead>\n<tbody>\n${rows}\n</tbody>\n</table>`;
}

export function registerDirectives(md: MarkdownIt): void {
  for (const type of DIRECTIVE_TYPES) {
    md.use(container, type, {
      validate(params: string) {
        return params.trim() === type;
      },
      render(tokens: any[], idx: number) {
        if (tokens[idx].nesting === 1) {
          return `<div class="directive directive-${type}">\n<div class="directive-label">${type}</div>\n`;
        }
        return "</div>\n";
      },
    });
  }

  // Override cheat container to render as a table
  md.use(container, "cheat-table", {
    validate(params: string) {
      return params.trim() === "cheat";
    },
  });

  // Post-process: convert cheat directive inner content to table
  const defaultFence = md.renderer.rules.fence;
  // We handle cheat tables via CSS and the container markup above.
  // The actual table conversion happens client-side or via a post-render step.
}

/** Parse cheat block content (pipe-delimited) into an HTML table. Exported for direct use. */
export { renderCheatTable };
