import { readConfig } from "./config-reader";
import { writeConfig } from "./config-writer";
import { GLOBAL_PATHS } from "./config-paths";
import type { ToolId, McpConfig, SyncResult } from "@/types";

export async function syncMcp(source: ToolId, targets: ToolId[]): Promise<SyncResult> {
  const sourceResult = await readConfig(source, "mcp");

  if (!sourceResult.exists || !sourceResult.content) {
    throw new Error(`Source ${source} MCP config not found`);
  }

  const sourceJson = JSON.parse(sourceResult.content) as McpConfig;
  const mcpServers = sourceJson.mcpServers ?? {};

  const applied: ToolId[] = [];
  const skipped: ToolId[] = [];
  const errors: Record<string, string> = {};

  for (const target of targets) {
    if (target === source) continue;

    const targetPathRaw = GLOBAL_PATHS[target]?.mcp;

    if (targetPathRaw === null || targetPathRaw === undefined) {
      skipped.push(target);
      continue;
    }

    try {
      const targetResult = await readConfig(target, "mcp");
      let targetJson: McpConfig = targetResult.exists && targetResult.content
        ? (JSON.parse(targetResult.content) as McpConfig)
        : { mcpServers: {} };

      // Merge: replace only mcpServers, preserve all other keys
      targetJson = { ...targetJson, mcpServers };

      await writeConfig(target, "mcp", JSON.stringify(targetJson, null, 2));
      applied.push(target);
    } catch (e: unknown) {
      errors[target] = e instanceof Error ? e.message : String(e);
    }
  }

  return { applied, skipped, errors };
}
