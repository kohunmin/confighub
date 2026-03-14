import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { expandPath } from "./config-paths";
import type { ToolId, SkillFile, SkillFrontmatter } from "@/types";

function scanSkillFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];

  function walk(current: string, depth: number) {
    if (depth > 6) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (entry.name === "SKILL.md") {
        results.push(fullPath);
      }
    }
  }

  walk(dir, 0);
  return results;
}

export function parseSkillFile(filePath: string): SkillFile {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(rawContent);

  const frontmatter: SkillFrontmatter = {
    name: String(parsed.data.name ?? path.basename(path.dirname(filePath))),
    description: String(parsed.data.description ?? ""),
    ...parsed.data,
  };

  return {
    path: filePath,
    name: frontmatter.name,
    frontmatter,
    body: parsed.content,
    rawContent,
  };
}

export function listSkills(tool: ToolId, projectRoot?: string): SkillFile[] {
  let searchDir: string | null = null;

  if (tool === "claude") {
    searchDir = expandPath("~/.claude/plugins/marketplaces");
  } else if (tool === "devin" && projectRoot) {
    searchDir = path.join(projectRoot, ".cognition/skills");
  }

  if (!searchDir) return [];

  const skillFiles = scanSkillFiles(searchDir);
  return skillFiles.map(parseSkillFile);
}
