"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { EditorPane } from "@/components/editor/EditorPane";
import { SaveButton } from "@/components/shared/SaveButton";
import { ComparisonPanel } from "@/components/diff/ComparisonPanel";
import { useDiff } from "@/hooks/useDiff";
import { SECTION_LABELS } from "@/lib/config-paths";
import type { ToolId, SectionId, ConfigReadResult, SkillFile, CrossToolDiff } from "@/types";

const TOOLS: ToolId[] = ["claude", "cursor", "windsurf", "devin"];
const SECTIONS: SectionId[] = ["mcp", "rules", "skills", "settings"];

export default function ToolPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tool = (params.tool as ToolId) ?? "claude";
  const section = (searchParams.get("section") as SectionId) ?? "mcp";

  const [projectRoot, setProjectRoot] = useState<string>("");
  const [sidebarWidth, setSidebarWidth] = useState(224); // 기본 w-56 = 224px
  const isResizing = useRef(false);

  // Restore state from localStorage after hydration
  useEffect(() => {
    const savedRoot = localStorage.getItem("confighub_projectRoot");
    if (savedRoot) setProjectRoot(savedRoot);
    const savedWidth = localStorage.getItem("confighub_sidebarWidth");
    if (savedWidth) setSidebarWidth(Number(savedWidth));
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(Math.max(e.clientX, 140), 480);
      setSidebarWidth(newWidth);
    };

    const onMouseUp = (e: MouseEvent) => {
      isResizing.current = false;
      const newWidth = Math.min(Math.max(e.clientX, 140), 480);
      localStorage.setItem("confighub_sidebarWidth", String(newWidth));
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  // Config state
  const [configResult, setConfigResult] = useState<ConfigReadResult | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Skills state
  const [skills, setSkills] = useState<SkillFile[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillFile | null>(null);
  const [skillContent, setSkillContent] = useState("");
  const [skillOriginal, setSkillOriginal] = useState("");

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Diff
  const { data: diffData, refetch: refetchDiff } = useDiff(
    section,
    projectRoot || undefined
  );

  // All section diffs for sidebar badges
  const [allDiffs, setAllDiffs] = useState<Partial<Record<SectionId, CrossToolDiff>>>({});

  const fetchAllDiffs = useCallback(async () => {
    const results = await Promise.all(
      SECTIONS.map(async (s) => {
        const params = new URLSearchParams({ section: s });
        if (projectRoot) params.set("projectRoot", projectRoot);
        const res = await fetch(`/api/diff?${params}`);
        const json = await res.json();
        return [s, json] as const;
      })
    );
    setAllDiffs(Object.fromEntries(results));
  }, [projectRoot]);

  useEffect(() => {
    fetchAllDiffs();
  }, [fetchAllDiffs]);

  // Load config when tool/section changes
  useEffect(() => {
    if (section === "skills") {
      // Load skills list
      const params = new URLSearchParams({ tool });
      if (projectRoot) params.set("projectRoot", projectRoot);
      fetch(`/api/skills?${params}`)
        .then((r) => r.json())
        .then((d) => {
          setSkills(d.skills ?? []);
          setSelectedSkill(null);
          setSkillContent("");
          setSkillOriginal("");
        });
      return;
    }

    const params = new URLSearchParams({ tool, section });
    if (projectRoot) params.set("projectRoot", projectRoot);

    fetch(`/api/config?${params}`)
      .then((r) => r.json())
      .then((data: ConfigReadResult) => {
        setConfigResult(data);
        setEditorContent(data.content ?? "");
        setOriginalContent(data.content ?? "");
        setSaveError(null);
      });
  }, [tool, section, projectRoot]);

  // Project root handler
  const handleProjectRootChange = (value: string) => {
    setProjectRoot(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("confighub_projectRoot", value);
    }
  };

  // Section change
  const handleSectionChange = (s: SectionId) => {
    router.push(`/tool/${tool}?section=${s}`);
  };

  // Save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const content = section === "skills" ? skillContent : editorContent;
      const filePath = section === "skills" ? selectedSkill?.path : configResult?.filePath;

      const res = await fetch("/api/config/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, section, content, filePath }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "저장 실패");

      if (section === "skills") {
        setSkillOriginal(skillContent);
      } else {
        setOriginalContent(editorContent);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      refetchDiff();
      fetchAllDiffs();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  };

  // Apply all (sync MCP)
  const handleApplyAll = async () => {
    if (section !== "mcp") return;
    setIsSyncing(true);
    try {
      const targets = TOOLS.filter((t) => t !== tool);
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: tool, targets }),
      });
      const result = await res.json();
      const msgs = [];
      if (result.applied?.length) msgs.push(`적용됨: ${result.applied.join(", ")}`);
      if (result.skipped?.length) msgs.push(`건너뜀: ${result.skipped.join(", ")}`);
      alert(msgs.join("\n") || "동기화 완료");
      refetchDiff();
      fetchAllDiffs();
    } finally {
      setIsSyncing(false);
    }
  };

  // File paths for sidebar — API에서 받은 절대 경로만 사용 (SSR hydration 불일치 방지)
  const filePaths: Partial<Record<SectionId, string>> = {};
  if (configResult?.filePath) filePaths[section] = configResult.filePath;

  const isDirty =
    section === "skills"
      ? skillContent !== skillOriginal
      : editorContent !== originalContent;

  const hasDiff = diffData?.hasDiff ?? false;
  const diffFlags: Partial<Record<SectionId, boolean>> = {};
  const diffCounts: Partial<Record<SectionId, number>> = {};
  for (const s of SECTIONS) {
    const d = allDiffs[s];
    if (d) {
      diffFlags[s] = d.hasDiff;
      diffCounts[s] = d.mcpDiffs?.length ?? 0;
    }
  }

  const editorLanguage: "json" | "markdown" =
    section === "mcp" || section === "settings" ? "json" : "markdown";

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc]">
      <TopBar
        activeTool={tool}
        activeSection={section}
        hasDiff={hasDiff}
        onApplyAll={handleApplyAll}
        isSyncing={isSyncing}
      />

      <div className="flex flex-1 min-h-0">
        <div style={{ width: sidebarWidth, minWidth: sidebarWidth }} className="shrink-0">
          <Sidebar
            tool={tool}
            activeSection={section}
            onSectionChange={handleSectionChange}
            filePaths={filePaths}
            diffFlags={diffFlags}
            diffCounts={diffCounts}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 bg-[#3e3e42] hover:bg-[#007acc] cursor-col-resize transition-colors active:bg-[#007acc]"
          title="드래그하여 사이드바 크기 조절"
        />

        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Project root input for project-scoped sections */}
          {(section === "rules" || (section === "skills" && tool === "devin")) && (
            <div className="px-4 py-2 bg-[#252526] border-b border-[#3e3e42] flex items-center gap-3">
              <span className="text-xs text-[#858585] shrink-0">프로젝트 경로</span>
              <input
                value={projectRoot}
                onChange={(e) => handleProjectRootChange(e.target.value)}
                placeholder="/Users/hunminko/Dev/my-project"
                className="flex-1 bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs font-mono text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              />
            </div>
          )}

          {/* Editor header */}
          <div className="px-4 py-2 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{SECTION_LABELS[section]}</span>
              {configResult?.parseError && (
                <span className="text-xs text-red-400">파싱 오류</span>
              )}
              {configResult?.exists === false && section !== "skills" && (
                <span className="text-xs text-[#858585]">(파일 없음)</span>
              )}
            </div>
            <SaveButton
              isDirty={isDirty}
              isSaving={isSaving}
              onSave={handleSave}
              error={saveError}
            />
          </div>

          {/* Main content area */}
          <div className="flex-1 min-h-0 flex min-w-0">
            {section === "skills" ? (
              <SkillsView
                skills={skills}
                selectedSkill={selectedSkill}
                skillContent={skillContent}
                onSelectSkill={(skill) => {
                  setSelectedSkill(skill);
                  setSkillContent(skill.rawContent);
                  setSkillOriginal(skill.rawContent);
                }}
                onContentChange={setSkillContent}
              />
            ) : (
              <EditorContent
                tool={tool}
                section={section}
                configResult={configResult}
                editorContent={editorContent}
                editorLanguage={editorLanguage}
                onContentChange={setEditorContent}
              />
            )}
          </div>

          {/* Comparison panel */}
          {diffData && <ComparisonPanel diff={diffData} />}
        </main>
      </div>

      {saveSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded text-sm">
          저장 완료
        </div>
      )}
    </div>
  );
}

function EditorContent({
  tool,
  section,
  configResult,
  editorContent,
  editorLanguage,
  onContentChange,
}: {
  tool: ToolId;
  section: SectionId;
  configResult: ConfigReadResult | null;
  editorContent: string;
  editorLanguage: "json" | "markdown";
  onContentChange: (v: string) => void;
}) {
  // Windsurf MCP not supported
  if (section === "mcp" && tool === "windsurf") {
    return (
      <div className="flex-1 flex items-center justify-center text-[#858585]">
        <div className="text-center">
          <div className="text-4xl mb-3">⚙</div>
          <div className="text-sm">MCP 설정 경로가 확인되지 않았습니다 (Windsurf)</div>
          <div className="text-xs mt-1 text-[#6e6e6e]">
            공식 MCP 지원 경로가 아직 확인되지 않았습니다.
          </div>
        </div>
      </div>
    );
  }

  if (!configResult) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#858585]">
        불러오는 중...
      </div>
    );
  }

  if (!configResult.exists && !editorContent) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 text-sm text-[#858585]">
          파일이 없습니다. 아래 에디터에서 새 내용을 작성하면 저장됩니다.
        </div>
        <EditorPane
          content={editorContent}
          language={editorLanguage}
          onChange={onContentChange}
        />
      </div>
    );
  }

  return (
    <EditorPane
      content={editorContent}
      language={editorLanguage}
      onChange={onContentChange}
    />
  );
}

function SkillsView({
  skills,
  selectedSkill,
  skillContent,
  onSelectSkill,
  onContentChange,
}: {
  skills: SkillFile[];
  selectedSkill: SkillFile | null;
  skillContent: string;
  onSelectSkill: (skill: SkillFile) => void;
  onContentChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-1 min-h-0">
      {/* Skills list */}
      <div className="w-52 shrink-0 border-r border-[#3e3e42] overflow-y-auto">
        {skills.length === 0 ? (
          <div className="px-4 py-3 text-xs text-[#858585]">스킬이 없습니다.</div>
        ) : (
          skills.map((skill) => (
            <button
              key={skill.path}
              onClick={() => onSelectSkill(skill)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors border-b border-[#3e3e42] ${
                selectedSkill?.path === skill.path
                  ? "bg-[#37373d] text-[#cccccc]"
                  : "text-[#858585] hover:bg-[#2a2d2e] hover:text-[#cccccc]"
              }`}
            >
              <div className="font-medium truncate">{skill.name}</div>
              <div className="text-xs text-[#6e6e6e] truncate mt-0.5">
                {skill.frontmatter.description}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Skill editor */}
      <div className="flex-1 h-full">
        {selectedSkill ? (
          <EditorPane
            content={skillContent}
            language="markdown"
            onChange={onContentChange}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#858585] h-full">
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-sm">왼쪽에서 스킬을 선택하세요</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
