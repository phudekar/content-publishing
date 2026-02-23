import { loadBook, validateBook, type BookData } from "./config/loader.js";
import { SiteGenerator } from "./renderer/site.js";
import { PDFGenerator } from "./renderer/pdf.js";
import { disposeHighlighter } from "./parser/markdown.js";

export class Pipeline {
  private book: BookData;

  constructor(private bookDir: string) {
    this.book = loadBook(bookDir);
  }

  getBook(): BookData {
    return this.book;
  }

  async generateSite(outputDir: string): Promise<void> {
    const gen = new SiteGenerator();
    await gen.generate(this.book, outputDir);
  }

  async generatePDF(outputPath: string): Promise<void> {
    const gen = new PDFGenerator();
    await gen.generate(this.book, outputPath);
  }

  static validate(bookDir: string): { valid: boolean; errors: string[] } {
    return validateBook(bookDir);
  }

  static dispose(): void {
    disposeHighlighter();
  }
}
