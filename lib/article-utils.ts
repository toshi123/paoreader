import { normalizeUrl } from "@/lib/url";
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

export function getArticleIdentity(article: Pick<Article, "id" | "link">): string {
  try {
    return normalizeUrl(article.link);
  } catch {
    return article.id;
  }
}

export function isSameArticle(
  left: Pick<Article, "id" | "link">,
  right: Pick<Article, "id" | "link">,
): boolean {
  return getArticleIdentity(left) === getArticleIdentity(right);
}

export function dedupeArticlesByLink(articles: Article[]): Article[] {
  const articleMap = new Map<string, Article>();

  for (const article of articles) {
    articleMap.set(getArticleIdentity(article), article);
  }

  return Array.from(articleMap.values());
}
