"use client";

type SaveButtonProps = {
  isSaved: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function SaveButton({ isSaved, onClick, disabled = false }: SaveButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isSaved}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        isSaved
          ? "border-amber-300 bg-amber-100 text-amber-900"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {isSaved ? "保存中" : "あとで読む"}
    </button>
  );
}
