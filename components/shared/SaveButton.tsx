"use client";

interface SaveButtonProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  error?: string | null;
}

export function SaveButton({ isDirty, isSaving, onSave, error }: SaveButtonProps) {
  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-xs text-red-400 max-w-xs truncate">{error}</span>
      )}
      <button
        onClick={onSave}
        disabled={!isDirty || isSaving}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          isDirty && !isSaving
            ? "bg-[#007acc] hover:bg-[#0098ff] text-white"
            : "bg-[#3e3e42] text-[#858585] cursor-not-allowed"
        }`}
      >
        {isSaving ? "저장 중..." : isDirty ? "저장" : "저장됨"}
      </button>
    </div>
  );
}
