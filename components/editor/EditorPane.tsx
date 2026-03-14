"use client";

import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EditorPaneProps {
  content: string;
  language: "json" | "markdown";
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: "on",
  automaticLayout: true,
  formatOnPaste: true,
  scrollBeyondLastLine: false,
  wordWrap: "on",
  tabSize: 2,
  renderLineHighlight: "all",
  bracketPairColorization: { enabled: true },
};

export function EditorPane({ content, language, onChange, readOnly }: EditorPaneProps) {
  return (
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        language={language}
        value={content}
        theme="vs-dark"
        options={{ ...editorOptions, readOnly: readOnly ?? false }}
        onChange={(value) => onChange(value ?? "")}
      />
    </div>
  );
}
