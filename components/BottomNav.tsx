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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-3 px-2 py-2">
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
    </nav>
  );
}
