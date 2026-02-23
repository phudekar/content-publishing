/** Universal IR node types for content — extensible for future transforms. */

export type DirectiveType = "goal" | "deliverables" | "diagram" | "cheat";

export interface TextNode {
  kind: "text";
  html: string;
}

export interface CodeBlockNode {
  kind: "code";
  language: string;
  code: string;
  html: string;
}

export interface DirectiveNode {
  kind: "directive";
  type: DirectiveType;
  html: string;
}

export type ContentNode = TextNode | CodeBlockNode | DirectiveNode;

export interface ParsedPage {
  title: string;
  tags: string[];
  html: string;
  nodes: ContentNode[];
}
