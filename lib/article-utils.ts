import type { Article, ArticleSort } from "@/lib/types";

export function sortArticles(articles: Article[], sort: ArticleSort): Article[] {
  return [...articles].sort((left, right) => {
    if (sort === "popular") {
      return (right.hatenaBookmarkCount ?? 0) - (left.hatenaBookmarkCount ?? 0);
    }

    if (sort === "oldest") {
      return (
        new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime()
      );
    }

    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });
}

export function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
