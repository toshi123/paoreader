import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";

import "./globals.css";

export const metadata: Metadata = {
  title: "PaoReader",
  description: "個人利用向けのモバイルファースト RSS リーダー",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PaoReader",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0284c7",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Header />
          <main className="mx-auto max-w-3xl px-4 py-5 pb-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
