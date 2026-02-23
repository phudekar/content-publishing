import { z } from "zod";

export const PDFConfigSchema = z.object({
  pageSize: z.string().default("A4"),
  cover: z.boolean().default(true),
  margins: z
    .object({
      top: z.number().default(20),
      bottom: z.number().default(20),
      left: z.number().default(15),
      right: z.number().default(15),
    })
    .default({}),
});

export const SiteConfigSchema = z.object({
  syntaxTheme: z.string().default("github-dark"),
  baseUrl: z.string().default("/"),
});

export const BookConfigSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  pdf: PDFConfigSchema.default({}),
  site: SiteConfigSchema.default({}),
  units: z.array(z.string()).min(1, "At least one unit is required"),
});

export const UnitConfigSchema = z.object({
  title: z.string(),
  order: z.number().int().positive(),
  pages: z.array(z.string()).min(1, "At least one page is required"),
});

export const PageMetaSchema = z.object({
  title: z.string(),
  tags: z.array(z.string()).optional(),
});

export type BookConfig = z.infer<typeof BookConfigSchema>;
export type UnitConfig = z.infer<typeof UnitConfigSchema>;
export type PageMeta = z.infer<typeof PageMetaSchema>;
export type PDFConfig = z.infer<typeof PDFConfigSchema>;
export type SiteConfig = z.infer<typeof SiteConfigSchema>;
