export type ToolId = "claude" | "cursor" | "windsurf" | "devin";
export type SectionId = "mcp" | "rules" | "skills" | "settings";

export interface McpServerEntry {
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
  type?: string;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerEntry>;
  [key: string]: unknown;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  tools?: string;
  version?: string;
  [key: string]: unknown;
}

export interface SkillFile {
  path: string;
  name: string;
  frontmatter: SkillFrontmatter;
  body: string;
  rawContent: string;
}

export interface ConfigReadResult {
  tool: ToolId;
  section: SectionId;
  filePath: string;
  content: string;
  exists: boolean;
  parseError?: string;
}

export interface ConfigWriteRequest {
  tool: ToolId;
  section: SectionId;
  content: string;
  filePath?: string; // for skills (specific file)
}

export interface McpFieldDiff {
  serverName: string;
  tools: Partial<Record<ToolId, McpServerEntry | undefined>>;
  kind: "missing" | "different";
}

export interface CrossToolDiff {
  section: SectionId;
  hasDiff: boolean;
  mcpDiffs?: McpFieldDiff[];
  markdownDiff?: string;
  configs?: Partial<Record<ToolId, ConfigReadResult>>;
}

export interface SyncRequest {
  source: ToolId;
  targets: ToolId[];
}

export interface SyncResult {
  applied: ToolId[];
  skipped: ToolId[];
  errors: Record<string, string>;
}
