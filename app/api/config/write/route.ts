import { NextRequest, NextResponse } from "next/server";
import { writeConfig } from "@/lib/config-writer";
import type { ConfigWriteRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: ConfigWriteRequest = await req.json();
    const { tool, section, content, filePath } = body;

    if (!tool || !section || content === undefined) {
      return NextResponse.json({ error: "tool, section, content required" }, { status: 400 });
    }

    const savedPath = await writeConfig(tool, section, content, filePath);
    return NextResponse.json({ ok: true, filePath: savedPath });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
