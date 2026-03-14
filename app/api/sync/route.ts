import { NextRequest, NextResponse } from "next/server";
import { syncMcp } from "@/lib/mcp-sync";
import type { SyncRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: SyncRequest = await req.json();
    const { source, targets } = body;

    if (!source || !targets?.length) {
      return NextResponse.json({ error: "source and targets required" }, { status: 400 });
    }

    const result = await syncMcp(source, targets);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
