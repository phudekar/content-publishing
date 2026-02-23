import { describe, it, expect } from "vitest";
import path from "node:path";
import { BookConfigSchema, UnitConfigSchema, PageMetaSchema } from "../src/config/schema.js";
import { loadBook, validateBook } from "../src/config/loader.js";

const FIXTURES = path.join(import.meta.dirname, "fixtures", "sample-book");

describe("BookConfigSchema", () => {
  it("validates a complete config", () => {
    const result = BookConfigSchema.parse({
      title: "Test Book",
      subtitle: "Sub",
      author: "Author",
      units: ["unit-01"],
    });
    expect(result.title).toBe("Test Book");
    expect(result.pdf.pageSize).toBe("A4");
    expect(result.site.syntaxTheme).toBe("github-dark");
  });

  it("rejects config without title", () => {
    expect(() => BookConfigSchema.parse({ units: ["u1"] })).toThrow();
  });

  it("rejects config with empty units", () => {
    expect(() => BookConfigSchema.parse({ title: "T", units: [] })).toThrow();
  });

  it("applies default pdf and site config", () => {
    const result = BookConfigSchema.parse({ title: "T", units: ["u1"] });
    expect(result.pdf.cover).toBe(true);
    expect(result.pdf.margins.top).toBe(20);
    expect(result.site.baseUrl).toBe("/");
  });
});

describe("UnitConfigSchema", () => {
  it("validates a unit config", () => {
    const result = UnitConfigSchema.parse({ title: "Unit 1", order: 1, pages: ["p1"] });
    expect(result.title).toBe("Unit 1");
  });

  it("rejects non-positive order", () => {
    expect(() => UnitConfigSchema.parse({ title: "U", order: 0, pages: ["p1"] })).toThrow();
  });

  it("rejects empty pages", () => {
    expect(() => UnitConfigSchema.parse({ title: "U", order: 1, pages: [] })).toThrow();
  });
});

describe("PageMetaSchema", () => {
  it("validates page metadata", () => {
    const result = PageMetaSchema.parse({ title: "Page 1", tags: ["a", "b"] });
    expect(result.tags).toEqual(["a", "b"]);
  });

  it("allows missing tags", () => {
    const result = PageMetaSchema.parse({ title: "Page 1" });
    expect(result.tags).toBeUndefined();
  });
});

describe("loadBook", () => {
  it("loads the sample book successfully", () => {
    const book = loadBook(FIXTURES);
    expect(book.config.title).toBe("Sample Book");
    expect(book.units).toHaveLength(1);
    expect(book.units[0].slug).toBe("unit-01-intro");
    expect(book.units[0].config.title).toBe("Introduction");
    expect(book.units[0].pages).toHaveLength(1);
    expect(book.units[0].pages[0].slug).toBe("01-getting-started");
    expect(book.units[0].pages[0].meta.title).toBe("Getting Started");
    expect(book.units[0].pages[0].meta.tags).toEqual(["intro", "setup"]);
    expect(book.units[0].pages[0].rawContent).toContain("# Getting Started");
  });

  it("throws for missing book.yaml", () => {
    expect(() => loadBook("/nonexistent")).toThrow("book.yaml not found");
  });
});

describe("validateBook", () => {
  it("returns valid for a correct book", () => {
    const result = validateBook(FIXTURES);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for missing book", () => {
    const result = validateBook("/nonexistent");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
