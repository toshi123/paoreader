import { readerStorageKeys, type ReaderStorage } from "@/lib/storage";
import { dedupeArticlesByLink, isSameArticle } from "@/lib/article-utils";
import type { Article, Feed } from "@/lib/types";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  const storage = getStorage();

  if (!storage) {
    return fallback;
  }

  const rawValue = storage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

export function createLocalStorageReaderStorage(): ReaderStorage {
  return {
    getFeeds() {
      return readJson<Feed[]>(readerStorageKeys.feeds, []);
    },
    saveFeeds(feeds) {
      writeJson(readerStorageKeys.feeds, feeds);
    },
    addFeed(feed) {
      const currentFeeds = this.getFeeds();
      const nextFeeds = [...currentFeeds, feed];

      this.saveFeeds(nextFeeds);

      return nextFeeds;
    },
    updateFeed(feed) {
      const nextFeeds = this.getFeeds().map((currentFeed) =>
        currentFeed.id === feed.id ? feed : currentFeed,
      );

      this.saveFeeds(nextFeeds);

      return nextFeeds;
    },
    removeFeed(feedId) {
      const nextFeeds = this.getFeeds().filter((feed) => feed.id !== feedId);

      this.saveFeeds(nextFeeds);

      return nextFeeds;
    },
    getArticles() {
      return readJson<Article[]>(readerStorageKeys.articles, []);
    },
    saveArticles(articles) {
      writeJson(readerStorageKeys.articles, articles);
    },
    replaceArticlesByFeed(feedId, articles) {
      const currentArticles = this.getArticles().filter(
        (article) => article.feedId !== feedId,
      );
      const nextArticles = dedupeArticlesByLink([...articles, ...currentArticles]);

      this.saveArticles(nextArticles);

      return nextArticles;
    },
    removeArticlesByFeedId(feedId) {
      const nextArticles = this.getArticles().filter(
        (article) => article.feedId !== feedId,
      );

      this.saveArticles(nextArticles);

      return nextArticles;
    },
    getSavedArticles() {
      return readJson<Article[]>(readerStorageKeys.savedArticles, []);
    },
    saveArticle(article) {
      const currentArticles = this.getSavedArticles();
      const alreadySaved = currentArticles.some(
        (savedArticle) => isSameArticle(savedArticle, article),
      );
      const nextArticles = alreadySaved
        ? currentArticles
        : [article, ...currentArticles];

      writeJson(readerStorageKeys.savedArticles, nextArticles);

      return nextArticles;
    },
    removeSavedArticle(article) {
      const nextArticles = this.getSavedArticles().filter(
        (savedArticle) => !isSameArticle(savedArticle, article),
      );

      writeJson(readerStorageKeys.savedArticles, nextArticles);

      return nextArticles;
    },
    getReadArticleIds() {
      return readJson<string[]>(readerStorageKeys.readArticleIds, []);
    },
    markArticleAsRead(articleId) {
      const currentIds = this.getReadArticleIds();

      if (currentIds.includes(articleId)) {
        return currentIds;
      }

      const nextIds = [...currentIds, articleId];

      writeJson(readerStorageKeys.readArticleIds, nextIds);

      return nextIds;
    },
  };
}
