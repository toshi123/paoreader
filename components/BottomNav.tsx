"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "記事" },
  { href: "/feeds", label: "フィード" },
  { href: "/saved", label: "保存" },
];

export function BottomNav() {
  const pathname = usePathname();

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav className="fixed inset-x-0 bottom-3 z-20 px-3">
      <div className="mx-auto flex w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-0 p-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-center text-sm font-medium transition ${
                  isActive
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex shrink-0 items-center justify-center border-l border-slate-200 bg-white/90 px-3 py-2 text-lg font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="ページの先頭へ戻る"
        >
          ↑
        </button>
      </div>
    </nav>
  );
}
