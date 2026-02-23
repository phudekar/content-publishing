import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";
import { MarkdownParser } from "../parser/markdown.js";
import type { BookData, UnitData, PageData } from "../config/loader.js";

interface FlatPage {
  slug: string;
  unitSlug: string;
  title: string;
}

function buildFlatPageList(book: BookData): FlatPage[] {
  const list: FlatPage[] = [];
  for (const unit of book.units) {
    for (const page of unit.pages) {
      list.push({ slug: page.slug, unitSlug: unit.slug, title: page.meta.title });
    }
  }
  return list;
}

export class SiteGenerator {
  private env: nunjucks.Environment;
  private parser: MarkdownParser;

  constructor(templateDir?: string) {
    const tplDir = templateDir ?? path.join(import.meta.dirname, "..", "templates");
    this.env = nunjucks.configure(tplDir, { autoescape: false });
    this.parser = new MarkdownParser();
  }

  async generate(book: BookData, outputDir: string): Promise<void> {
    await this.parser.init();

    const baseUrl = book.config.site.baseUrl;
    fs.mkdirSync(outputDir, { recursive: true });

    // Copy CSS
    const assetsDir = path.join(outputDir, "assets");
    fs.mkdirSync(assetsDir, { recursive: true });
    const cssSource = path.join(import.meta.dirname, "..", "templates", "assets", "style.css");
    fs.copyFileSync(cssSource, path.join(assetsDir, "style.css"));

    // Render index
    const indexHtml = this.env.render("index.njk", {
      book: book.config,
      units: book.units,
      baseUrl,
    });
    fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml);

    const flatPages = buildFlatPageList(book);

    // Render units and pages
    for (let ui = 0; ui < book.units.length; ui++) {
      const unit = book.units[ui];
      const unitDir = path.join(outputDir, unit.slug);
      fs.mkdirSync(unitDir, { recursive: true });

      const unitHtml = this.env.render("unit.njk", {
        book: book.config,
        unit,
        baseUrl,
        prevUnit: ui > 0 ? book.units[ui - 1] : null,
        nextUnit: ui < book.units.length - 1 ? book.units[ui + 1] : null,
      });
      fs.writeFileSync(path.join(unitDir, "index.html"), unitHtml);

      for (let pi = 0; pi < unit.pages.length; pi++) {
        const page = unit.pages[pi];
        const html = this.parser.render(page.rawContent);

        // Find global index for prev/next
        const globalIdx = flatPages.findIndex(
          (fp) => fp.slug === page.slug && fp.unitSlug === unit.slug
        );
        const prevPage = globalIdx > 0 ? flatPages[globalIdx - 1] : null;
        const nextPage = globalIdx < flatPages.length - 1 ? flatPages[globalIdx + 1] : null;

        const pageHtml = this.env.render("page.njk", {
          book: book.config,
          unit,
          page,
          content: html,
          baseUrl,
          prevPage,
          nextPage,
        });
        fs.writeFileSync(path.join(unitDir, `${page.slug}.html`), pageHtml);
      }
    }
  }
}
