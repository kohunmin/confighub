import { NextRequest, NextResponse } from "next/server";
import { readConfig, readRulesFiles } from "@/lib/config-reader";
import type { ToolId, SectionId } from "@/types";

export async function GET(req: NextRequest) {
  const tool = req.nextUrl.searchParams.get("tool") as ToolId;
  const section = req.nextUrl.searchParams.get("section") as SectionId;
  const projectRoot = req.nextUrl.searchParams.get("projectRoot") ?? undefined;

  if (!tool || !section) {
    return NextResponse.json({ error: "tool and section are required" }, { status: 400 });
  }

  if (section === "rules") {
    if (!projectRoot) {
      return NextResponse.json({ tool, section, files: [], projectRoot: null });
    }
    const files = await readRulesFiles(tool, projectRoot);
    return NextResponse.json({ tool, section, files, projectRoot });
  }

  const result = await readConfig(tool, section, projectRoot);
  return NextResponse.json(result);
}
