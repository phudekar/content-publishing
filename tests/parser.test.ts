import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MarkdownParser, disposeHighlighter } from "../src/parser/markdown.js";

let parser: MarkdownParser;

beforeAll(async () => {
  parser = new MarkdownParser("github-dark");
  await parser.init();
});

afterAll(() => {
  disposeHighlighter();
});

describe("MarkdownParser", () => {
  it("renders basic markdown to HTML", () => {
    const html = parser.render("# Hello\n\nA paragraph.");
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<p>A paragraph.</p>");
  });

  it("renders inline code", () => {
    const html = parser.render("Use `npm install` to install.");
    expect(html).toContain("<code>npm install</code>");
  });

  it("renders links", () => {
    const html = parser.render("[Click here](https://example.com)");
    expect(html).toContain('href="https://example.com"');
  });

  it("renders lists", () => {
    const html = parser.render("- Item 1\n- Item 2\n");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>Item 1</li>");
  });
});

describe("Shiki syntax highlighting", () => {
  it("highlights Python code blocks", () => {
    const html = parser.render('```python\nprint("hello")\n```');
    expect(html).toContain("shiki");
    expect(html).toContain("print");
  });

  it("highlights SQL code blocks", () => {
    const html = parser.render("```sql\nSELECT * FROM users;\n```");
    expect(html).toContain("shiki");
    expect(html).toContain("SELECT");
  });

  it("falls back to plaintext for unknown languages", () => {
    const html = parser.render("```unknownlang\nfoo bar\n```");
    expect(html).toContain("foo bar");
  });
});

describe("Custom directives", () => {
  it("renders :::goal directive", () => {
    const html = parser.render(":::goal\nLearn something.\n:::");
    expect(html).toContain('class="directive directive-goal"');
    expect(html).toContain("Learn something.");
  });

  it("renders :::deliverables directive", () => {
    const html = parser.render(":::deliverables\n- Item A\n- Item B\n:::");
    expect(html).toContain('class="directive directive-deliverables"');
    expect(html).toContain("Item A");
  });

  it("renders :::diagram directive with mermaid block", () => {
    const html = parser.render(":::diagram\ngraph LR\n    A --> B\n:::");
    expect(html).toContain('class="directive directive-diagram"');
    expect(html).toContain('class="mermaid"');
    expect(html).toContain("graph LR");
  });

  it("renders :::cheat directive", () => {
    const html = parser.render(":::cheat\nbun install | Install deps\n:::");
    expect(html).toContain('class="directive directive-cheat"');
    expect(html).toContain("bun install");
  });
});
