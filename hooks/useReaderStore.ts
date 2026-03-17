"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchFeedFromApi } from "@/lib/feed-api";
import { dedupeArticlesByLink, isSameArticle } from "@/lib/article-utils";
import { createLocalStorageReaderStorage } from "@/lib/local-storage";
import { isValidUrl, normalizeUrl } from "@/lib/url";
import type { Article, Feed } from "@/lib/types";

const legacyFeedIds = new Set(["feed-dev", "feed-product", "feed-mobile"]);

function mergeArticles(baseArticles: Article[], savedArticles: Article[]): Article[] {
  return dedupeArticlesByLink([...savedArticles, ...baseArticles]);
}

export function useReaderStore() {
  const storage = useMemo(() => createLocalStorageReaderStorage(), []);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [storedArticles, setStoredArticles] = useState<Article[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [readArticleIds, setReadArticleIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const currentFeeds = storage.getFeeds();
    const currentArticles = storage.getArticles();
    const nextFeeds = currentFeeds.filter((feed) => !legacyFeedIds.has(feed.id));
    const nextArticles = currentArticles.filter(
      (article) => !legacyFeedIds.has(article.feedId),
    );

    if (nextFeeds.length !== currentFeeds.length) {
      storage.saveFeeds(nextFeeds);
    }

    if (nextArticles.length !== currentArticles.length) {
      storage.saveArticles(nextArticles);
    }

    setFeeds(nextFeeds);
    setStoredArticles(nextArticles);
    setSavedArticles(storage.getSavedArticles());
    setReadArticleIds(storage.getReadArticleIds());
    setIsHydrated(true);
  }, [storage]);

  const articles = useMemo(() => {
    const subscribedFeedIds = new Set(feeds.map((feed) => feed.id));

    return storedArticles.filter((article) => subscribedFeedIds.has(article.feedId));
  }, [feeds, storedArticles]);

  const allArticles = useMemo(() => {
    return mergeArticles(articles, savedArticles);
  }, [articles, savedArticles]);

  const isArticleSaved = useCallback(
    (article: Article): boolean => {
      return savedArticles.some((savedArticle) => isSameArticle(savedArticle, article));
    },
    [savedArticles],
  );

  const addFeed = useCallback(
    async (url: string): Promise<{ ok: true } | { ok: false; message: string }> => {
      if (!isValidUrl(url)) {
        return { ok: false, message: "有効な http / https URL を入力してください。" };
      }

      const normalizedUrl = normalizeUrl(url);
      const alreadyExists = feeds.some(
        (feed) => normalizeUrl(feed.url) === normalizedUrl,
      );

      if (alreadyExists) {
        return { ok: false, message: "そのフィードはすでに登録されています。" };
      }

      try {
        const { feed, articles: fetchedArticles } = await fetchFeedFromApi(normalizedUrl);
        const nextFeeds = storage.addFeed(feed);
        const nextArticles = storage.replaceArticlesByFeed(feed.id, fetchedArticles);

        setFeeds(nextFeeds);
        setStoredArticles(nextArticles);

        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "フィードの追加に失敗しました。",
        };
      }
    },
    [feeds, storage],
  );

  const refreshFeed = useCallback(
    async (feedId: string): Promise<{ ok: true } | { ok: false; message: string }> => {
      const currentFeed = feeds.find((feed) => feed.id === feedId);

      if (!currentFeed) {
        return { ok: false, message: "対象のフィードが見つかりません。" };
      }

      try {
        const { feed, articles: fetchedArticles } = await fetchFeedFromApi(currentFeed.url);
        const nextFeed: Feed = {
          ...currentFeed,
          ...feed,
          id: currentFeed.id,
          createdAt: currentFeed.createdAt,
          lastFetchedAt: feed.lastFetchedAt ?? new Date().toISOString(),
        };
        const nextFeedArticles = fetchedArticles.map((article) => ({
          ...article,
          feedId: currentFeed.id,
          feedTitle: nextFeed.title,
        }));
        const nextFeeds = storage.updateFeed(nextFeed);
        const nextArticles = storage.replaceArticlesByFeed(
          currentFeed.id,
          nextFeedArticles,
        );

        setFeeds(nextFeeds);
        setStoredArticles(nextArticles);

        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "フィードの更新に失敗しました。",
        };
      }
    },
    [feeds, storage],
  );

  const removeFeed = useCallback(
    (feedId: string): void => {
      const nextFeeds = storage.removeFeed(feedId);
      const nextArticles = storage.removeArticlesByFeedId(feedId);

      setFeeds(nextFeeds);
      setStoredArticles(nextArticles);
    },
    [storage],
  );

  const toggleSavedArticle = useCallback(
    (article: Article): void => {
      const isSaved = savedArticles.some((savedArticle) =>
        isSameArticle(savedArticle, article),
      );
      const nextArticles = isSaved
        ? storage.removeSavedArticle(article)
        : storage.saveArticle(article);

      setSavedArticles(nextArticles);
    },
    [savedArticles, storage],
  );

  const markArticleAsRead = useCallback(
    (articleId: string): void => {
      const nextIds = storage.markArticleAsRead(articleId);

      setReadArticleIds(nextIds);
    },
    [storage],
  );

  return {
    feeds,
    articles,
    allArticles,
    savedArticles,
    readArticleIds,
    isHydrated,
    isArticleSaved,
    addFeed,
    refreshFeed,
    removeFeed,
    toggleSavedArticle,
    markArticleAsRead,
  };
}
