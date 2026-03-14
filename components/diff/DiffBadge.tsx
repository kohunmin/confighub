"use client";

interface DiffBadgeProps {
  visible: boolean;
  count?: number;
}

export function DiffBadge({ visible, count }: DiffBadgeProps) {
  if (!visible) return null;
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
      ⚠{count != null ? ` ${count}` : ""}
    </span>
  );
}
