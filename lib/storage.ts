import type { Article, Feed } from "@/lib/types";

export interface ReaderStorage {
  getFeeds(): Feed[];
  saveFeeds(feeds: Feed[]): void;
  addFeed(feed: Feed): Feed[];
  removeFeed(feedId: string): Feed[];
  getArticles(): Article[];
  saveArticles(articles: Article[]): void;
  replaceArticlesByFeed(feedId: string, articles: Article[]): Article[];
  removeArticlesByFeedId(feedId: string): Article[];
  getSavedArticles(): Article[];
  saveArticle(article: Article): Article[];
  removeSavedArticle(articleId: string): Article[];
  getReadArticleIds(): string[];
  markArticleAsRead(articleId: string): string[];
}

export const readerStorageKeys = {
  feeds: "paoreader:feeds",
  articles: "paoreader:articles",
  savedArticles: "paoreader:savedArticles",
  readArticleIds: "paoreader:readArticleIds",
} as const;
