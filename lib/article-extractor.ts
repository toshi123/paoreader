import type { ArticleContent } from "@/lib/types";

export async function extractArticleContent(url: string): Promise<ArticleContent> {
  return {
    articleId: "unknown-article",
    title: "記事本文",
    url,
    siteName: new URL(url).hostname.replace(/^www\./, ""),
    excerpt: "本文抽出はまだ未実装です。",
    content:
      "この本文はダミー実装です。将来的には Reader Mode 互換の抽出ロジックや Cloudflare Functions 経由の本文取得へ差し替える想定です。",
  };
}
