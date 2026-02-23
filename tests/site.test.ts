import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadBook } from "../src/config/loader.js";
import { SiteGenerator } from "../src/renderer/site.js";
import { disposeHighlighter } from "../src/parser/markdown.js";

const FIXTURES = path.join(import.meta.dirname, "fixtures", "sample-book");
let outputDir: string;

beforeAll(async () => {
  outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "publisher-site-"));
  const book = loadBook(FIXTURES);
  const templateDir = path.join(import.meta.dirname, "..", "src", "templates");
  const gen = new SiteGenerator(templateDir);
  await gen.generate(book, outputDir);
});

afterAll(() => {
  disposeHighlighter();
  fs.rmSync(outputDir, { recursive: true, force: true });
});

describe("SiteGenerator", () => {
  it("creates index.html", () => {
    expect(fs.existsSync(path.join(outputDir, "index.html"))).toBe(true);
  });

  it("creates assets/style.css", () => {
    expect(fs.existsSync(path.join(outputDir, "assets", "style.css"))).toBe(true);
  });

  it("creates unit directory with index.html", () => {
    expect(fs.existsSync(path.join(outputDir, "unit-01-intro", "index.html"))).toBe(true);
  });

  it("creates page HTML file", () => {
    expect(
      fs.existsSync(path.join(outputDir, "unit-01-intro", "01-getting-started.html"))
    ).toBe(true);
  });

  it("index.html contains book title", () => {
    const html = fs.readFileSync(path.join(outputDir, "index.html"), "utf-8");
    expect(html).toContain("Sample Book");
  });

  it("index.html contains unit link", () => {
    const html = fs.readFileSync(path.join(outputDir, "index.html"), "utf-8");
    expect(html).toContain("Introduction");
    expect(html).toContain("unit-01-intro");
  });

  it("page HTML contains rendered markdown", () => {
    const html = fs.readFileSync(
      path.join(outputDir, "unit-01-intro", "01-getting-started.html"),
      "utf-8"
    );
    expect(html).toContain("Getting Started");
    expect(html).toContain("directive-goal");
    expect(html).toContain("shiki");
  });

  it("page HTML has breadcrumb navigation", () => {
    const html = fs.readFileSync(
      path.join(outputDir, "unit-01-intro", "01-getting-started.html"),
      "utf-8"
    );
    expect(html).toContain("breadcrumb");
    expect(html).toContain("Sample Book");
  });

  it("page HTML includes tags", () => {
    const html = fs.readFileSync(
      path.join(outputDir, "unit-01-intro", "01-getting-started.html"),
      "utf-8"
    );
    expect(html).toContain("intro");
    expect(html).toContain("setup");
  });

  it("unit HTML has unit title", () => {
    const html = fs.readFileSync(
      path.join(outputDir, "unit-01-intro", "index.html"),
      "utf-8"
    );
    expect(html).toContain("Introduction");
  });
});
