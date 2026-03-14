import { NextRequest, NextResponse } from "next/server";
import { listSkills } from "@/lib/skill-parser";
import type { ToolId } from "@/types";

export async function GET(req: NextRequest) {
  const tool = req.nextUrl.searchParams.get("tool") as ToolId;
  const projectRoot = req.nextUrl.searchParams.get("projectRoot") ?? undefined;

  if (!tool) {
    return NextResponse.json({ error: "tool is required" }, { status: 400 });
  }

  try {
    const skills = listSkills(tool, projectRoot);
    return NextResponse.json({ skills });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
