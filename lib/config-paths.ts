import path from "path";
import os from "os";
import type { ToolId, SectionId } from "@/types";

export function expandPath(p: string): string {
  if (p.startsWith("~/")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return path.resolve(p);
}

// Global (user-level) config paths — null means "not supported"
export const GLOBAL_PATHS: Record<ToolId, Partial<Record<SectionId, string | null>>> = {
  claude: {
    mcp: "~/Library/Application Support/Claude/claude_desktop_config.json",
    settings: "~/.claude/settings.json",
  },
  cursor: {
    mcp: "~/.cursor/mcp.json",
    settings: "~/Library/Application Support/Cursor/User/settings.json",
  },
  windsurf: {
    mcp: null, // not confirmed / not supported
  },
  devin: {
    settings: "~/.config/cognition/config.json",
  },
};

// Project-scoped rule file patterns (relative to a project root)
export const RULES_PATTERNS: Record<ToolId, string | null> = {
  claude: "CLAUDE.md",
  cursor: ".cursor/rules",   // directory — list *.md files
  windsurf: ".windsurf/rules", // directory — list *.md files
  devin: "AGENTS.md",
};

// Skills directories (relative to project root or global)
export const SKILLS_PATHS: Record<ToolId, string | null> = {
  claude: "~/.claude/plugins/marketplaces", // scan for skills/<name>/SKILL.md
  cursor: null,
  windsurf: null,
  devin: null, // project-scoped: .cognition/skills
};

export const TOOL_LABELS: Record<ToolId, string> = {
  claude: "Claude Code",
  cursor: "Cursor",
  windsurf: "Windsurf",
  devin: "Devin",
};

export const SECTION_LABELS: Record<SectionId, string> = {
  mcp: "MCP 서버",
  rules: "Agent Rules",
  skills: "Skills",
  settings: "설정",
};
