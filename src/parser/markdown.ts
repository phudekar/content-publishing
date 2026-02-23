import MarkdownIt from "markdown-it";
import { createHighlighter, type Highlighter } from "shiki";
import { registerDirectives } from "./directives.js";

let _highlighter: Highlighter | null = null;

async function getHighlighter(theme: string): Promise<Highlighter> {
  if (!_highlighter) {
    _highlighter = await createHighlighter({
      themes: [theme],
      langs: [
        "python",
        "sql",
        "bash",
        "yaml",
        "json",
        "typescript",
        "javascript",
        "java",
        "scala",
        "dockerfile",
        "toml",
        "ini",
        "xml",
        "html",
        "css",
        "go",
        "rust",
        "markdown",
        "plaintext",
      ],
    });
  }
  return _highlighter;
}

export class MarkdownParser {
  private md: MarkdownIt;
  private theme: string;

  constructor(theme: string = "github-dark") {
    this.theme = theme;
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });
    registerDirectives(this.md);
  }

  async init(): Promise<void> {
    const highlighter = await getHighlighter(this.theme);

    this.md.options.highlight = (code: string, lang: string) => {
      const language = lang || "plaintext";
      try {
        return highlighter.codeToHtml(code, { lang: language, theme: this.theme });
      } catch {
        // Fall back to plaintext if language not loaded
        return highlighter.codeToHtml(code, { lang: "plaintext", theme: this.theme });
      }
    };
  }

  render(markdown: string): string {
    return this.md.render(markdown);
  }
}

/** Dispose the shared highlighter (for cleanup in tests). */
export function disposeHighlighter(): void {
  if (_highlighter) {
    _highlighter.dispose();
    _highlighter = null;
  }
}
