"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchFeedFromApi } from "@/lib/feed-api";
import { fetchHatenaCountFromApi } from "@/lib/hatena-api";
import {
  dedupeArticlesByLink,
  isSameArticle,
  shouldRefreshHatenaCount,
} from "@/lib/article-utils";
import { createLocalStorageReaderStorage } from "@/lib/local-storage";
import { isValidUrl, normalizeUrl } from "@/lib/url";
import type { Article, Feed, FeedCandidate } from "@/lib/types";

const legacyFeedIds = new Set(["feed-dev", "feed-product", "feed-mobile"]);

function mergeArticles(baseArticles: Article[], savedArticles: Article[]): Article[] {
  return dedupeArticlesByLink([...savedArticles, ...baseArticles]);
}

export function useReaderStore() {
  const storage = useMemo(() => createLocalStorageReaderStorage(), []);
  const fetchingHatenaArticleIdsRef = useRef<Set<string>>(new Set());
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

  const updateArticleHatenaCount = useCallback(
    (article: Article, count: number | null): void => {
      const updatedArticle: Article = {
        ...article,
        hatenaBookmarkCount: count,
        hatenaCountFetchedAt: new Date().toISOString(),
      };
      const nextStoredArticles = storage.updateArticle(updatedArticle);

      setStoredArticles(nextStoredArticles);

      if (savedArticles.some((savedArticle) => isSameArticle(savedArticle, article))) {
        const nextSavedArticles = storage.saveArticle(updatedArticle);

        setSavedArticles(nextSavedArticles);
      }
    },
    [savedArticles, storage],
  );

  const isArticleSaved = useCallback(
    (article: Article): boolean => {
      return savedArticles.some((savedArticle) => isSameArticle(savedArticle, article));
    },
    [savedArticles],
  );

  const addFeed = useCallback(
    async (
      url: string,
    ): Promise<
      | { ok: true }
      | { ok: false; message: string }
      | { ok: false; requiresSelection: true; candidates: FeedCandidate[]; siteUrl: string }
    > => {
      if (!isValidUrl(url)) {
        return { ok: false, message: "有効な http / https URL を入力してください。" };
      }

      const normalizedUrl = normalizeUrl(url);
      const alreadyExists = feeds.some(
        (feed) =>
          normalizeUrl(feed.url) === normalizedUrl ||
          (feed.siteUrl ? normalizeUrl(feed.siteUrl) === normalizedUrl : false),
      );

      if (alreadyExists) {
        return { ok: false, message: "そのフィードはすでに登録されています。" };
      }

      try {
        const response = await fetchFeedFromApi(normalizedUrl);

        if ("requiresSelection" in response) {
          return {
            ok: false,
            requiresSelection: true,
            candidates: response.candidates,
            siteUrl: response.siteUrl,
          };
        }

        const { feed, articles: fetchedArticles } = response;
        const resolvedDuplicate = feeds.some(
          (currentFeed) =>
            normalizeUrl(currentFeed.url) === normalizeUrl(feed.url) ||
            (currentFeed.siteUrl && feed.siteUrl
              ? normalizeUrl(currentFeed.siteUrl) === normalizeUrl(feed.siteUrl)
              : false),
        );

        if (resolvedDuplicate) {
          return {
            ok: false,
            message: "そのサイトのフィードはすでに登録されています。",
          };
        }

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
        const response = await fetchFeedFromApi(currentFeed.url);

        if ("requiresSelection" in response) {
          return {
            ok: false,
            message: "複数のフィード候補が見つかりました。個別に URL を指定してください。",
          };
        }

        const { feed, articles: fetchedArticles } = response;
        const nextFeed: Feed = {
          ...currentFeed,
          ...feed,
          id: currentFeed.id,
          createdAt: currentFeed.createdAt,
          lastFetchedAt: feed.lastFetchedAt ?? new Date().toISOString(),
        };
        const nextFeedArticles = fetchedArticles.map((article: Article) => ({
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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const targetArticles = allArticles.filter(
      (article) =>
        shouldRefreshHatenaCount(article) &&
        !fetchingHatenaArticleIdsRef.current.has(article.id),
    );

    if (targetArticles.length === 0) {
      return;
    }

    for (const article of targetArticles) {
      fetchingHatenaArticleIdsRef.current.add(article.id);

      void (async () => {
        try {
          const count = await fetchHatenaCountFromApi(article.link);

          updateArticleHatenaCount(article, count);
        } finally {
          fetchingHatenaArticleIdsRef.current.delete(article.id);
        }
      })();
    }
  }, [allArticles, isHydrated, updateArticleHatenaCount]);

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
