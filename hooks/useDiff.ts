"use client";

import { useState, useEffect, useCallback } from "react";
import type { SectionId, CrossToolDiff } from "@/types";

export function useDiff(section: SectionId, projectRoot?: string) {
  const [data, setData] = useState<CrossToolDiff | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ section });
      if (projectRoot) params.set("projectRoot", projectRoot);
      const res = await fetch(`/api/diff?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [section, projectRoot]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}
