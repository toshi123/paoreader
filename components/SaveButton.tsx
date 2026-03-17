"use client";

type SaveButtonProps = {
  isSaved: boolean;
  onClick: () => void;
};

export function SaveButton({ isSaved, onClick }: SaveButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isSaved}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        isSaved
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {isSaved ? "保存済み" : "あとで読む"}
    </button>
  );
}
