import fs from "fs";
import path from "path";
import { resolveFilePath } from "./config-reader";
import type { ToolId, SectionId } from "@/types";

export async function writeConfig(
  tool: ToolId,
  section: SectionId,
  content: string,
  customFilePath?: string
): Promise<string> {
  const filePath = customFilePath ?? resolveFilePath(tool, section);

  if (!filePath) {
    throw new Error(`No file path for ${tool}/${section}`);
  }

  // Validate JSON before writing
  if (section === "mcp" || section === "settings") {
    try {
      JSON.parse(content);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`JSON 파싱 오류: ${msg}`);
    }
  }

  // Ensure parent directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create backup if file exists
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.bak.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
  }

  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}
