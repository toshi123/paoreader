"use client";

import type { ArticleSort } from "@/lib/types";

type SortSelectorProps = {
  value: ArticleSort;
  onChange: (value: ArticleSort) => void;
};

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span>並び順</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ArticleSort)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        <option value="newest">新着順</option>
        <option value="hatena">はてブ順</option>
      </select>
    </label>
  );
}
