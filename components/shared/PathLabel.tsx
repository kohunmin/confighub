"use client";

import { useState } from "react";

interface PathLabelProps {
  path: string;
}

export function PathLabel({ path }: PathLabelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!path) {
    return <span className="text-[#858585] text-xs font-mono">—</span>;
  }

  const lastSlash = path.lastIndexOf("/");
  const dir = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : "";
  const filename = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;

  return (
    <button
      onClick={handleCopy}
      className="flex items-start gap-1 text-xs font-mono text-[#858585] hover:text-[#cccccc] transition-colors group w-full text-left"
      title={copied ? "복사됨!" : path}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[#cccccc] truncate">{filename}</div>
        <div className="text-[#585858] truncate text-[10px] mt-0.5">{dir}</div>
      </div>
      <span className="opacity-0 group-hover:opacity-100 shrink-0 mt-0.5">
        {copied ? "✓" : "⎘"}
      </span>
    </button>
  );
}
