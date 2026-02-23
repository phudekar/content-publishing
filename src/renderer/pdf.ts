import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import nunjucks from "nunjucks";
import puppeteer from "puppeteer";
import { MarkdownParser } from "../parser/markdown.js";
import type { BookData } from "../config/loader.js";

function findTemplatesDir(): string {
  let dir = import.meta.dirname;
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, "src", "templates");
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error("Could not find src/templates directory");
}

export class PDFGenerator {
  private env: nunjucks.Environment;
  private parser: MarkdownParser;

  constructor(templateDir?: string) {
    const tplDir = templateDir ?? findTemplatesDir();
    this.env = nunjucks.configure(tplDir, { autoescape: false });
    this.parser = new MarkdownParser();
  }

  async generate(book: BookData, outputPath: string): Promise<void> {
    await this.parser.init();

    // Render all page content
    const renderedPages: Record<string, string> = {};
    for (const unit of book.units) {
      for (const page of unit.pages) {
        const key = `${unit.slug}/${page.slug}`;
        renderedPages[key] = this.parser.render(page.rawContent);
      }
    }

    // Load CSS
    const cssPath = path.join(findTemplatesDir(), "assets", "style.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    // Render the full PDF HTML
    const html = this.env.render("pdf.njk", {
      book: book.config,
      units: book.units,
      renderedPages,
      css,
    });

    // Write temp HTML
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "publisher-pdf-"));
    const tmpHtml = path.join(tmpDir, "document.html");
    fs.writeFileSync(tmpHtml, html);

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({ headless: true });
    try {
      const browserPage = await browser.newPage();
      await browserPage.goto(`file://${tmpHtml}`, { waitUntil: "networkidle0" });

      // Wait for Mermaid diagrams to render (if any)
      await browserPage.evaluate(() => {
        return new Promise<void>((resolve) => {
          const mermaidEls = document.querySelectorAll(".mermaid");
          if (mermaidEls.length === 0) return resolve();
          // Mermaid replaces <pre class="mermaid"> content with SVG; wait for that
          const check = () => {
            const hasSvg = Array.from(mermaidEls).every((el) => el.querySelector("svg"));
            if (hasSvg) resolve();
            else setTimeout(check, 100);
          };
          setTimeout(check, 500);
        });
      });

      const margins = book.config.pdf.margins;
      await browserPage.pdf({
        path: outputPath,
        format: book.config.pdf.pageSize as any,
        margin: {
          top: `${margins.top}mm`,
          bottom: `${margins.bottom}mm`,
          left: `${margins.left}mm`,
          right: `${margins.right}mm`,
        },
        printBackground: true,
      });
    } finally {
      await browser.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}
