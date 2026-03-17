"use client";

import type { ArticleReadFilter } from "@/lib/types";

type ArticleFiltersProps = {
  readFilter: ArticleReadFilter;
  savedOnly: boolean;
  onChangeReadFilter: (value: ArticleReadFilter) => void;
  onToggleSavedOnly: () => void;
};

const readFilterOptions: Array<{ value: ArticleReadFilter; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "unread", label: "未読" },
  { value: "read", label: "既読" },
];

export function ArticleFilters({
  readFilter,
  savedOnly,
  onChangeReadFilter,
  onToggleSavedOnly,
}: ArticleFiltersProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {readFilterOptions.map((option) => {
          const isActive = readFilter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChangeReadFilter(option.value)}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={savedOnly}
          onClick={onToggleSavedOnly}
          className={`rounded-full px-3 py-2 text-sm font-medium transition ${
            savedOnly
              ? "bg-amber-100 text-amber-900"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          保存済みのみ
        </button>
      </div>
    </div>
  );
}
