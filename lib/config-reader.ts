import fs from "fs";
import path from "path";
import { expandPath, GLOBAL_PATHS, RULES_PATTERNS } from "./config-paths";
import type { ToolId, SectionId, ConfigReadResult } from "@/types";

export async function readConfig(
  tool: ToolId,
  section: SectionId,
  projectRoot?: string
): Promise<ConfigReadResult> {
  const filePath = resolveFilePath(tool, section, projectRoot);

  if (filePath === null) {
    return { tool, section, filePath: "", content: "", exists: false };
  }

  if (!fs.existsSync(filePath)) {
    return { tool, section, filePath, content: "", exists: false };
  }

  const content = fs.readFileSync(filePath, "utf-8");

  // Validate JSON for mcp/settings sections
  if (section === "mcp" || section === "settings") {
    try {
      JSON.parse(content);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { tool, section, filePath, content, exists: true, parseError: msg };
    }
  }

  return { tool, section, filePath, content, exists: true };
}

export function resolveFilePath(
  tool: ToolId,
  section: SectionId,
  projectRoot?: string
): string | null {
  if (section === "mcp" || section === "settings") {
    const rawPath = GLOBAL_PATHS[tool]?.[section];
    if (rawPath === undefined) return null;
    if (rawPath === null) return null;
    return expandPath(rawPath);
  }

  if (section === "rules") {
    const pattern = RULES_PATTERNS[tool];
    if (!pattern) return null;
    if (!projectRoot) return null;

    const resolved = path.join(projectRoot, pattern);
    // For cursor/windsurf rules directories, return the directory path
    // The caller will list files. For single-file rules, return the file.
    return resolved;
  }

  if (section === "skills") {
    // Skills are listed via /api/skills, not single-file read
    return null;
  }

  return null;
}

export async function readRulesFiles(
  tool: ToolId,
  projectRoot: string
): Promise<Array<{ path: string; name: string; content: string }>> {
  const pattern = RULES_PATTERNS[tool];
  if (!pattern) return [];

  const fullPath = path.join(projectRoot, pattern);

  // Single file (CLAUDE.md / AGENTS.md)
  if (pattern.endsWith(".md")) {
    if (!fs.existsSync(fullPath)) return [];
    const content = fs.readFileSync(fullPath, "utf-8");
    return [{ path: fullPath, name: path.basename(fullPath), content }];
  }

  // Directory of .md files
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) return [];

  const files = fs.readdirSync(fullPath).filter((f) => f.endsWith(".md"));
  return files.map((f) => {
    const fp = path.join(fullPath, f);
    return { path: fp, name: f, content: fs.readFileSync(fp, "utf-8") };
  });
}
