import type MarkdownIt from "markdown-it";
import container from "markdown-it-container";

const SIMPLE_DIRECTIVES = ["goal", "deliverables"] as const;

// Inline SVG icons (16x16, Lucide-style)
const ICONS: Record<string, string> = {
  goal: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  deliverables: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  diagram: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M10 6.5h4"/><path d="M10 17.5h4"/><path d="M6.5 10v4"/><path d="M17.5 10v4"/></svg>',
  cheat: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>',
};

function directiveLabel(type: string): string {
  const icon = ICONS[type] || "";
  return `<div class="directive-label">${icon} ${type}</div>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCheatTable(content: string): string {
  const rows = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.includes("|"))
    .map((line) => {
      const pipeIdx = line.indexOf("|");
      const cmd = line.slice(0, pipeIdx).trim();
      const desc = line.slice(pipeIdx + 1).trim();
      return `<tr><td><code>${escapeHtml(cmd)}</code></td><td>${escapeHtml(desc)}</td></tr>`;
    })
    .join("\n");
  return `<table class="cheat-table">\n<thead><tr><th>Command</th><th>Description</th></tr></thead>\n<tbody>\n${rows}\n</tbody>\n</table>`;
}

export function registerDirectives(md: MarkdownIt): void {
  // Register simple directives (content rendered normally by markdown-it)
  for (const type of SIMPLE_DIRECTIVES) {
    md.use(container, type, {
      validate(params: string) {
        return params.trim() === type;
      },
      render(tokens: any[], idx: number) {
        if (tokens[idx].nesting === 1) {
          return `<div class="directive directive-${type}">\n${directiveLabel(type)}\n`;
        }
        return "</div>\n";
      },
    });
  }

  // Register diagram directive — renders inner content as a Mermaid diagram
  md.use(container, "diagram", {
    validate(params: string) {
      return params.trim() === "diagram";
    },
    render(tokens: any[], idx: number) {
      if (tokens[idx].nesting === 1) {
        let raw = "";
        for (let i = idx + 1; i < tokens.length; i++) {
          if (tokens[i].type === "container_diagram_close") break;
          if (tokens[i].content) {
            raw += tokens[i].content + "\n";
          }
          tokens[i].type = "text";
          tokens[i].content = "";
          tokens[i].children = null;
          tokens[i].tag = "";
        }
        return `<div class="directive directive-diagram">\n${directiveLabel("diagram")}\n<pre class="mermaid">${escapeHtml(raw.trim())}</pre>\n`;
      }
      return "</div>\n";
    },
  });

  // Register cheat directive — renders inner content as a pipe-delimited table
  md.use(container, "cheat", {
    validate(params: string) {
      return params.trim() === "cheat";
    },
    render(tokens: any[], idx: number) {
      if (tokens[idx].nesting === 1) {
        let raw = "";
        for (let i = idx + 1; i < tokens.length; i++) {
          if (tokens[i].type === "container_cheat_close") break;
          if (tokens[i].content) {
            raw += tokens[i].content + "\n";
          }
          tokens[i].type = "text";
          tokens[i].content = "";
          tokens[i].children = null;
          tokens[i].tag = "";
        }
        const table = renderCheatTable(raw);
        return `<div class="directive directive-cheat">\n${directiveLabel("cheat")}\n${table}\n`;
      }
      return "</div>\n";
    },
  });
}

export { renderCheatTable };
