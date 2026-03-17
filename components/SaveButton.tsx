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
      className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isSaved
          ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {isSaved ? "保存済み" : "あとで読む"}
    </button>
  );
}
