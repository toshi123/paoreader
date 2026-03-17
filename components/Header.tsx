"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "記事一覧",
  "/feeds": "フィード管理",
  "/saved": "あとで読む",
};

export function Header() {
  const pathname = usePathname();
  const title = pathname.startsWith("/article/")
    ? "記事詳細"
    : (pageTitles[pathname] ?? "PaoReader");

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-600">
            PaoReader
          </p>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        </div>
      </div>
    </header>
  );
}
