"use client";

import { useState, useEffect, useCallback } from "react";
import type { ToolId, SectionId, ConfigReadResult } from "@/types";

export function useConfig(
  tool: ToolId,
  section: SectionId,
  projectRoot?: string
) {
  const [data, setData] = useState<ConfigReadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ tool, section });
      if (projectRoot) params.set("projectRoot", projectRoot);
      const res = await fetch(`/api/config?${params}`);
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tool, section, projectRoot]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = useCallback(
    async (content: string, filePath?: string) => {
      const res = await fetch("/api/config/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, section, content, filePath }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      await refetch();
      return json;
    },
    [tool, section, refetch]
  );

  return { data, loading, error, refetch, save };
}
