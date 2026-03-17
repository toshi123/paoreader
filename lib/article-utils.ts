import { normalizeUrl } from "@/lib/url";
import type { Article, ArticleReadFilter, ArticleSort } from "@/lib/types";

export function sortArticles(articles: Article[], sort: ArticleSort): Article[] {
  return [...articles].sort((left, right) => {
    if (sort === "hatena") {
      const countDifference =
        (right.hatenaBookmarkCount ?? 0) - (left.hatenaBookmarkCount ?? 0);

      if (countDifference !== 0) {
        return countDifference;
      }
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

export function mergeArticleCollections(
  preferredArticles: Article[],
  fallbackArticles: Article[],
): Article[] {
  const articleMap = new Map<string, Article>();

  for (const fallbackArticle of fallbackArticles) {
    articleMap.set(getArticleIdentity(fallbackArticle), fallbackArticle);
  }

  for (const preferredArticle of preferredArticles) {
    const identity = getArticleIdentity(preferredArticle);
    const fallbackArticle = articleMap.get(identity);

    articleMap.set(
      identity,
      mergeArticleData(preferredArticle, fallbackArticle ?? preferredArticle),
    );
  }

  return Array.from(articleMap.values());
}

export function mergeArticleData(
  preferredArticle: Article,
  fallbackArticle: Article,
): Article {
  return {
    ...fallbackArticle,
    ...preferredArticle,
    hatenaBookmarkCount:
      preferredArticle.hatenaBookmarkCount ?? fallbackArticle.hatenaBookmarkCount ?? null,
    hatenaCountFetchedAt:
      preferredArticle.hatenaCountFetchedAt ?? fallbackArticle.hatenaCountFetchedAt,
  };
}

export function filterArticles(
  articles: Article[],
  options: {
    readFilter: ArticleReadFilter;
    readArticleIds: string[];
    savedOnly: boolean;
    isArticleSaved: (article: Article) => boolean;
  },
): Article[] {
  return articles.filter((article) => {
    const isRead = options.readArticleIds.includes(article.id);
    const matchesReadFilter =
      options.readFilter === "all" ||
      (options.readFilter === "read" && isRead) ||
      (options.readFilter === "unread" && !isRead);
    const matchesSavedFilter = !options.savedOnly || options.isArticleSaved(article);

    return matchesReadFilter && matchesSavedFilter;
  });
}

export function shouldRefreshHatenaCount(article: Article): boolean {
  if (!article.hatenaCountFetchedAt) {
    return article.hatenaBookmarkCount == null;
  }

  const fetchedAt = new Date(article.hatenaCountFetchedAt).getTime();

  if (Number.isNaN(fetchedAt)) {
    return true;
  }

  const twelveHours = 1000 * 60 * 60 * 12;

  return Date.now() - fetchedAt > twelveHours;
}
