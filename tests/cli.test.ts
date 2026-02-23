import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Pipeline } from "../src/pipeline.js";
import { disposeHighlighter } from "../src/parser/markdown.js";

const FIXTURES = path.join(import.meta.dirname, "fixtures", "sample-book");

afterAll(() => {
  disposeHighlighter();
});

describe("Pipeline", () => {
  it("loads a book from directory", () => {
    const pipeline = new Pipeline(FIXTURES);
    const book = pipeline.getBook();
    expect(book.config.title).toBe("Sample Book");
    expect(book.units).toHaveLength(1);
  });

  it("validates a valid book", () => {
    const result = Pipeline.validate(FIXTURES);
    expect(result.valid).toBe(true);
  });

  it("reports errors for invalid book", () => {
    const result = Pipeline.validate("/nonexistent");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("generates a site end-to-end", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "publisher-e2e-site-"));
    try {
      const pipeline = new Pipeline(FIXTURES);
      await pipeline.generateSite(tmpDir);
      expect(fs.existsSync(path.join(tmpDir, "index.html"))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, "assets", "style.css"))).toBe(true);
      expect(
        fs.existsSync(path.join(tmpDir, "unit-01-intro", "01-getting-started.html"))
      ).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("generates a PDF end-to-end", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "publisher-e2e-pdf-"));
    const outputPath = path.join(tmpDir, "test.pdf");
    try {
      const pipeline = new Pipeline(FIXTURES);
      await pipeline.generatePDF(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      expect(fs.statSync(outputPath).size).toBeGreaterThan(1000);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 60000);
});
