import { NextRequest, NextResponse } from "next/server";
import { readConfig } from "@/lib/config-reader";
import { computeCrossToolDiff } from "@/lib/diff-engine";
import type { ToolId, SectionId } from "@/types";

const TOOLS: ToolId[] = ["claude", "cursor", "windsurf", "devin"];

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section") as SectionId;
  const projectRoot = req.nextUrl.searchParams.get("projectRoot") ?? undefined;

  if (!section) {
    return NextResponse.json({ error: "section is required" }, { status: 400 });
  }

  // Read configs from all tools in parallel
  const entries = await Promise.all(
    TOOLS.map(async (tool) => {
      const result = await readConfig(tool, section, projectRoot);
      return [tool, result] as const;
    })
  );

  const configs = Object.fromEntries(entries) as Record<ToolId, import("@/types").ConfigReadResult>;

  const diff = await computeCrossToolDiff(section, configs);
  return NextResponse.json(diff);
}
