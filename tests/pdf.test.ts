import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadBook } from "../src/config/loader.js";
import { PDFGenerator } from "../src/renderer/pdf.js";
import { disposeHighlighter } from "../src/parser/markdown.js";

const FIXTURES = path.join(import.meta.dirname, "fixtures", "sample-book");
let outputPath: string;
let tmpDir: string;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "publisher-pdf-test-"));
  outputPath = path.join(tmpDir, "test-output.pdf");
  const book = loadBook(FIXTURES);
  const templateDir = path.join(import.meta.dirname, "..", "src", "templates");
  const gen = new PDFGenerator(templateDir);
  await gen.generate(book, outputPath);
}, 60000);

afterAll(() => {
  disposeHighlighter();
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("PDFGenerator", () => {
  it("generates a PDF file", () => {
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it("PDF file is non-empty", () => {
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(1000);
  });

  it("PDF file starts with PDF header", () => {
    const buf = Buffer.alloc(5);
    const fd = fs.openSync(outputPath, "r");
    fs.readSync(fd, buf, 0, 5, 0);
    fs.closeSync(fd);
    expect(buf.toString("ascii")).toBe("%PDF-");
  });
});
