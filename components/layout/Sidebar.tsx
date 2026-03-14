"use client";

import { DiffBadge } from "@/components/diff/DiffBadge";
import { PathLabel } from "@/components/shared/PathLabel";
import { SECTION_LABELS, TOOL_LABELS } from "@/lib/config-paths";
import type { ToolId, SectionId } from "@/types";
import clsx from "clsx";

const SECTIONS: SectionId[] = ["mcp", "rules", "skills", "settings"];

interface SidebarProps {
  tool: ToolId;
  activeSection: SectionId;
  onSectionChange: (s: SectionId) => void;
  filePaths: Partial<Record<SectionId, string>>;
  diffFlags: Partial<Record<SectionId, boolean>>;
  diffCounts: Partial<Record<SectionId, number>>;
}

export function Sidebar({
  tool,
  activeSection,
  onSectionChange,
  filePaths,
  diffFlags,
  diffCounts,
}: SidebarProps) {
  return (
    <aside className="w-full h-full bg-[#252526] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[#3e3e42]">
        <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
          {TOOL_LABELS[tool]}
        </div>
      </div>

      <nav className="flex-1 py-1 overflow-y-auto">
        {SECTIONS.map((section) => {
          const isActive = section === activeSection;
          const hasDiff = diffFlags[section] ?? false;
          const count = diffCounts[section];

          return (
            <div key={section}>
              <button
                onClick={() => onSectionChange(section)}
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[#37373d] text-[#cccccc]"
                    : "text-[#858585] hover:bg-[#2a2d2e] hover:text-[#cccccc]"
                )}
              >
                <span>{SECTION_LABELS[section]}</span>
                <DiffBadge visible={hasDiff} count={count} />
              </button>

              {isActive && filePaths[section] && (
                <div className="px-4 py-2 bg-[#1e1e1e] border-t border-[#3e3e42]">
                  <div className="text-xs text-[#858585] mb-1">경로</div>
                  <PathLabel path={filePaths[section]!} />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
