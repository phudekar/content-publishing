import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import matter from "gray-matter";
import {
  BookConfigSchema,
  UnitConfigSchema,
  PageMetaSchema,
  type BookConfig,
  type UnitConfig,
  type PageMeta,
} from "./schema.js";

export interface PageData {
  slug: string;
  meta: PageMeta;
  rawContent: string;
  filePath: string;
}

export interface UnitData {
  slug: string;
  config: UnitConfig;
  pages: PageData[];
  dirPath: string;
}

export interface BookData {
  config: BookConfig;
  units: UnitData[];
  bookDir: string;
}

function loadYaml(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf-8");
  return yaml.load(raw);
}

function loadPage(mdPath: string, slug: string): PageData {
  const raw = fs.readFileSync(mdPath, "utf-8");
  const { data, content } = matter(raw);
  const meta = PageMetaSchema.parse(data);
  return { slug, meta, rawContent: content, filePath: mdPath };
}

function loadUnit(unitDir: string, slug: string): UnitData {
  const configPath = path.join(unitDir, "_unit.yaml");
  if (!fs.existsSync(configPath)) {
    throw new Error(`Unit config not found: ${configPath}`);
  }
  const raw = loadYaml(configPath);
  const config = UnitConfigSchema.parse(raw);

  const pages = config.pages.map((pageSlug) => {
    const mdPath = path.join(unitDir, `${pageSlug}.md`);
    if (!fs.existsSync(mdPath)) {
      throw new Error(`Page not found: ${mdPath}`);
    }
    return loadPage(mdPath, pageSlug);
  });

  return { slug, config, pages, dirPath: unitDir };
}

export function loadBook(bookDir: string): BookData {
  const bookYamlPath = path.join(bookDir, "book.yaml");
  if (!fs.existsSync(bookYamlPath)) {
    throw new Error(`book.yaml not found in ${bookDir}`);
  }

  const raw = loadYaml(bookYamlPath);
  const config = BookConfigSchema.parse(raw);

  const units = config.units.map((unitSlug) => {
    const unitDir = path.join(bookDir, unitSlug);
    if (!fs.existsSync(unitDir)) {
      throw new Error(`Unit directory not found: ${unitDir}`);
    }
    return loadUnit(unitDir, unitSlug);
  });

  return { config, units, bookDir };
}

export function validateBook(bookDir: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  try {
    loadBook(bookDir);
    return { valid: true, errors: [] };
  } catch (err) {
    if (err instanceof Error) {
      errors.push(err.message);
    } else {
      errors.push(String(err));
    }
    return { valid: false, errors };
  }
}
