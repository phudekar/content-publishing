#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import { Pipeline } from "./pipeline.js";

const program = new Command();

program
  .name("publisher")
  .description("Generate PDF and static websites from Markdown content")
  .version("0.1.0");

const build = program.command("build").description("Build output from a book");

build
  .command("site")
  .description("Generate a static website")
  .requiredOption("--book-dir <path>", "Path to the book directory")
  .option("-o, --output <path>", "Output directory", "_site")
  .action(async (opts) => {
    const bookDir = path.resolve(opts.bookDir);
    const outputDir = path.resolve(opts.output);
    const spinner = ora("Building static site...").start();
    try {
      const pipeline = new Pipeline(bookDir);
      await pipeline.generateSite(outputDir);
      Pipeline.dispose();
      spinner.succeed(chalk.green(`Site generated at ${outputDir}`));
    } catch (err) {
      spinner.fail(chalk.red("Site generation failed"));
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

build
  .command("pdf")
  .description("Generate a PDF document")
  .requiredOption("--book-dir <path>", "Path to the book directory")
  .option("-o, --output <path>", "Output PDF path", "output.pdf")
  .action(async (opts) => {
    const bookDir = path.resolve(opts.bookDir);
    const outputPath = path.resolve(opts.output);
    const spinner = ora("Building PDF...").start();
    try {
      const pipeline = new Pipeline(bookDir);
      await pipeline.generatePDF(outputPath);
      Pipeline.dispose();
      spinner.succeed(chalk.green(`PDF generated at ${outputPath}`));
    } catch (err) {
      spinner.fail(chalk.red("PDF generation failed"));
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("validate")
  .description("Validate a book configuration")
  .requiredOption("--book-dir <path>", "Path to the book directory")
  .action((opts) => {
    const bookDir = path.resolve(opts.bookDir);
    const result = Pipeline.validate(bookDir);
    if (result.valid) {
      console.log(chalk.green("Book is valid!"));
    } else {
      console.log(chalk.red("Book validation failed:"));
      for (const err of result.errors) {
        console.log(chalk.red(`  - ${err}`));
      }
      process.exit(1);
    }
  });

program.parse();
