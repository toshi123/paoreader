import type { ArticleContent } from "@/lib/types";

export async function extractArticleContent(url: string): Promise<ArticleContent> {
  return {
    articleId: "unknown-article",
    title: "",
    url,
    siteName: new URL(url).hostname.replace(/^www\./, ""),
    excerpt: "",
    content: "",
  };
}
