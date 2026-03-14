"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CrossToolDiff, ToolId } from "@/types";
import { TOOL_LABELS } from "@/lib/config-paths";

const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.DiffEditor),
  { ssr: false }
);

interface ComparisonPanelProps {
  diff: CrossToolDiff;
}

export function ComparisonPanel({ diff }: ComparisonPanelProps) {
  const [open, setOpen] = useState(false);

  const diffCount =
    diff.section === "mcp" || diff.section === "settings"
      ? (diff.mcpDiffs?.length ?? 0)
      : diff.markdownDiff
        ? diff.markdownDiff.split("\n@@").length - 1
        : 0;

  return (
    <div className="border-t border-[#3e3e42] bg-[#1e1e1e]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>전체 비교</span>
          {diff.hasDiff && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
              DIFF {diffCount > 0 ? diffCount : ""}
            </span>
          )}
        </span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-[#3e3e42]">
          {diff.section === "mcp" || diff.section === "settings" ? (
            <McpComparisonTable diff={diff} />
          ) : (
            <MarkdownComparisonView diff={diff} />
          )}
        </div>
      )}
    </div>
  );
}

function McpComparisonTable({ diff }: { diff: CrossToolDiff }) {
  const configs = diff.configs ?? {};
  const tools = (Object.keys(configs) as ToolId[]).filter(
    (t) => configs[t]?.exists
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-[#3e3e42]">
            <th className="px-3 py-2 text-left text-[#858585] w-36">서버 이름</th>
            {tools.map((t) => (
              <th key={t} className="px-3 py-2 text-left text-[#858585]">
                {TOOL_LABELS[t]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diff.mcpDiffs?.map((d) => (
            <tr key={d.serverName} className="border-b border-[#3e3e42] bg-yellow-400/5">
              <td className="px-3 py-2 text-yellow-400">{d.serverName}</td>
              {tools.map((t) => {
                const entry = d.tools[t];
                return (
                  <td key={t} className="px-3 py-2 text-[#cccccc]">
                    {entry ? (
                      <span className="text-green-400">
                        {entry.command ?? entry.url ?? "configured"}
                      </span>
                    ) : (
                      <span className="text-[#858585]">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {/* Show all servers that are the same */}
          {(() => {
            const mcpDiffNames = new Set(diff.mcpDiffs?.map((d) => d.serverName) ?? []);
            const allServerNames = new Set<string>();

            for (const t of tools) {
              const content = configs[t]?.content;
              if (content) {
                try {
                  const parsed = JSON.parse(content);
                  Object.keys(parsed.mcpServers ?? {}).forEach((s) => allServerNames.add(s));
                } catch {}
              }
            }

            const sameServers = [...allServerNames].filter((s) => !mcpDiffNames.has(s));

            return sameServers.map((serverName) => (
              <tr key={serverName} className="border-b border-[#3e3e42]">
                <td className="px-3 py-2 text-[#cccccc]">{serverName}</td>
                {tools.map((t) => {
                  let entry: import("@/types").McpServerEntry | undefined;
                  const content = configs[t]?.content;
                  if (content) {
                    try {
                      entry = JSON.parse(content).mcpServers?.[serverName];
                    } catch {}
                  }
                  return (
                    <td key={t} className="px-3 py-2 text-green-400">
                      {entry ? entry.command ?? entry.url ?? "configured" : "—"}
                    </td>
                  );
                })}
              </tr>
            ));
          })()}
        </tbody>
      </table>
    </div>
  );
}

function MarkdownComparisonView({ diff }: { diff: CrossToolDiff }) {
  const configs = diff.configs ?? {};
  const tools = (Object.keys(configs) as ToolId[]).filter(
    (t) => configs[t]?.exists
  );

  if (tools.length < 2) {
    return (
      <div className="px-4 py-3 text-[#858585] text-sm">
        비교할 파일이 2개 미만입니다.
      </div>
    );
  }

  const toolA = tools[0];
  const toolB = tools[1];

  return (
    <div className="h-72">
      <div className="flex text-xs text-[#858585] border-b border-[#3e3e42]">
        <div className="flex-1 px-3 py-1">{TOOL_LABELS[toolA]}</div>
        <div className="flex-1 px-3 py-1 border-l border-[#3e3e42]">{TOOL_LABELS[toolB]}</div>
      </div>
      <div className="h-64">
        <MonacoDiffEditor
          height="100%"
          theme="vs-dark"
          original={configs[toolA]?.content ?? ""}
          modified={configs[toolB]?.content ?? ""}
          language="markdown"
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 12,
          }}
        />
      </div>
    </div>
  );
}
