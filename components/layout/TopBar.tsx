"use client";

import Link from "next/link";
import { DiffBadge } from "@/components/diff/DiffBadge";
import { TOOL_LABELS } from "@/lib/config-paths";
import type { ToolId, SectionId } from "@/types";
import clsx from "clsx";

const TOOLS: ToolId[] = ["claude", "cursor", "windsurf", "devin"];

interface TopBarProps {
  activeTool: ToolId;
  activeSection: SectionId;
  hasDiff: boolean;
  onApplyAll: () => void;
  isSyncing: boolean;
}

export function TopBar({ activeTool, activeSection, hasDiff, onApplyAll, isSyncing }: TopBarProps) {
  return (
    <header className="h-10 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between shrink-0">
      <div className="flex items-center h-full">
        <div className="px-4 text-sm font-semibold text-[#cccccc] border-r border-[#3e3e42] h-full flex items-center">
          ⚙ ConfigHub
        </div>
        {TOOLS.map((tool) => (
          <Link
            key={tool}
            href={`/tool/${tool}?section=${activeSection}`}
            className={clsx(
              "px-4 h-full flex items-center text-sm transition-colors border-t-2",
              activeTool === tool
                ? "bg-[#1e1e1e] text-[#cccccc] border-[#007acc]"
                : "text-[#858585] border-transparent hover:text-[#cccccc] hover:bg-[#2a2d2e]"
            )}
          >
            {TOOL_LABELS[tool]}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4">
        {hasDiff && <DiffBadge visible count={undefined} />}
        <button
          onClick={onApplyAll}
          disabled={isSyncing}
          className={clsx(
            "px-3 py-1 rounded text-sm font-medium transition-colors",
            isSyncing
              ? "bg-[#3e3e42] text-[#858585] cursor-not-allowed"
              : "bg-[#007acc] hover:bg-[#0098ff] text-white"
          )}
          title="현재 도구의 MCP 설정을 모든 도구에 적용합니다"
        >
          {isSyncing ? "동기화 중..." : "↕ 전체 적용"}
        </button>
      </div>
    </header>
  );
}
