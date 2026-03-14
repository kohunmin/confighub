import { createTwoFilesPatch } from "diff";
import type { ToolId, SectionId, McpConfig, McpFieldDiff, CrossToolDiff, ConfigReadResult } from "@/types";

export function computeMcpDiff(
  configs: Partial<Record<ToolId, ConfigReadResult>>
): McpFieldDiff[] {
  const parsed: Partial<Record<ToolId, McpConfig>> = {};

  for (const [toolId, result] of Object.entries(configs)) {
    if (result?.exists && result.content && !result.parseError) {
      try {
        parsed[toolId as ToolId] = JSON.parse(result.content) as McpConfig;
      } catch {
        // skip
      }
    }
  }

  const toolIds = Object.keys(parsed) as ToolId[];
  if (toolIds.length < 2) return [];

  // Collect all server names
  const allServers = new Set<string>();
  for (const cfg of Object.values(parsed)) {
    if (cfg?.mcpServers) {
      Object.keys(cfg.mcpServers).forEach((s) => allServers.add(s));
    }
  }

  const diffs: McpFieldDiff[] = [];

  for (const serverName of allServers) {
    const entries: Partial<Record<ToolId, ReturnType<typeof Object.values<McpConfig>>[0]["mcpServers"][string] | undefined>> = {};
    for (const toolId of toolIds) {
      entries[toolId] = parsed[toolId]?.mcpServers?.[serverName];
    }

    // Check if all tools have the same entry
    const values = Object.values(entries);
    const hasUndefined = values.some((v) => v === undefined);
    const allSame = !hasUndefined && values.every(
      (v) => JSON.stringify(v) === JSON.stringify(values[0])
    );

    if (!allSame) {
      diffs.push({
        serverName,
        tools: entries as Partial<Record<ToolId, import("@/types").McpServerEntry | undefined>>,
        kind: hasUndefined ? "missing" : "different",
      });
    }
  }

  return diffs;
}

export function computeMarkdownDiff(
  configs: Partial<Record<ToolId, ConfigReadResult>>
): string {
  const tools = (Object.entries(configs) as [ToolId, ConfigReadResult][]).filter(
    ([, v]) => v?.exists && v.content
  );

  if (tools.length < 2) return "";

  const [labelA, resultA] = tools[0];
  const [labelB, resultB] = tools[1];

  return createTwoFilesPatch(labelA, labelB, resultA.content ?? "", resultB.content ?? "");
}

export async function computeCrossToolDiff(
  section: SectionId,
  configs: Partial<Record<ToolId, ConfigReadResult>>
): Promise<CrossToolDiff> {
  if (section === "mcp") {
    const mcpDiffs = computeMcpDiff(configs);
    return {
      section,
      hasDiff: mcpDiffs.length > 0,
      mcpDiffs,
      configs,
    };
  }

  if (section === "rules") {
    const markdownDiff = computeMarkdownDiff(configs);
    return {
      section,
      hasDiff: markdownDiff.length > 0,
      markdownDiff,
      configs,
    };
  }

  if (section === "settings") {
    const mcpDiffs = computeMcpDiff(configs); // reuse JSON diff
    return {
      section,
      hasDiff: mcpDiffs.length > 0,
      mcpDiffs,
      configs,
    };
  }

  return { section, hasDiff: false, configs };
}
