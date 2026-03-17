"use client";

import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { FeedForm } from "@/components/FeedForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useReaderStore } from "@/hooks/useReaderStore";
import { formatDateLabel } from "@/lib/article-utils";

export function FeedsScreen() {
  const { feeds, addFeed, refreshFeed, removeFeed, isHydrated } = useReaderStore();
  const [refreshingFeedIds, setRefreshingFeedIds] = useState<string[]>([]);
  const [feedErrors, setFeedErrors] = useState<Record<string, string>>({});
  const [bulkRefreshState, setBulkRefreshState] = useState<{
    isRunning: boolean;
    completed: number;
    total: number;
    successCount: number;
    failureCount: number;
  }>({
    isRunning: false,
    completed: 0,
    total: 0,
    successCount: 0,
    failureCount: 0,
  });

  async function handleRefreshFeed(feedId: string) {
    if (bulkRefreshState.isRunning) {
      return;
    }

    setRefreshingFeedIds((currentIds) => [...currentIds, feedId]);
    setFeedErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      delete nextErrors[feedId];

      return nextErrors;
    });

    try {
      const result = await refreshFeed(feedId);

      if (!result.ok) {
        setFeedErrors((currentErrors) => ({
          ...currentErrors,
          [feedId]: result.message,
        }));
      }
    } finally {
      setRefreshingFeedIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== feedId),
      );
    }
  }

  async function handleRefreshAllFeeds() {
    if (feeds.length === 0 || bulkRefreshState.isRunning) {
      return;
    }

    setFeedErrors({});
    setBulkRefreshState({
      isRunning: true,
      completed: 0,
      total: feeds.length,
      successCount: 0,
      failureCount: 0,
    });

    let successCount = 0;
    let failureCount = 0;

    for (const feed of feeds) {
      setRefreshingFeedIds((currentIds) => [...currentIds, feed.id]);

      const result = await refreshFeed(feed.id);

      if (result.ok) {
        successCount += 1;
      } else {
        failureCount += 1;
        setFeedErrors((currentErrors) => ({
          ...currentErrors,
          [feed.id]: result.message,
        }));
      }

      setRefreshingFeedIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== feed.id),
      );
      setBulkRefreshState({
        isRunning: true,
        completed: successCount + failureCount,
        total: feeds.length,
        successCount,
        failureCount,
      });
    }

    setBulkRefreshState({
      isRunning: false,
      completed: feeds.length,
      total: feeds.length,
      successCount,
      failureCount,
    });
  }

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  return (
    <section className="space-y-4">
      <FeedForm onSubmit={addFeed} />
      {feeds.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">フィードを更新</h2>
            <p className="text-sm text-slate-500">
              登録済みのフィードを順番に再取得します。
            </p>
          </div>
          {bulkRefreshState.total > 0 ? (
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>
                進行状況: {bulkRefreshState.completed} / {bulkRefreshState.total}
              </p>
              <p>
                成功 {bulkRefreshState.successCount}件 / 失敗 {bulkRefreshState.failureCount}件
              </p>
            </div>
          ) : null}
          <div className="mt-4">
            <button
              type="button"
              disabled={bulkRefreshState.isRunning}
              onClick={handleRefreshAllFeeds}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkRefreshState.isRunning ? "更新中..." : "すべて更新"}
            </button>
          </div>
        </div>
      ) : null}
      {feeds.length === 0 ? (
        <EmptyState
          title="購読フィードがありません"
          description="RSS / Atom の URL を追加すると、記事一覧に反映されます。"
        />
      ) : (
        <div className="space-y-3">
          {feeds.map((feed) => (
            <article
              key={feed.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-slate-900">{feed.title}</h2>
                  <p className="break-all text-sm text-slate-500">{feed.url}</p>
                  {feed.description ? (
                    <p className="text-sm leading-6 text-slate-600">{feed.description}</p>
                  ) : null}
                  <div className="space-y-1 text-xs text-slate-400">
                    <p>{feed.articleCount ?? 0}件の記事を取得</p>
                    <p>
                      最終更新:
                      {" "}
                      {feed.lastFetchedAt
                        ? formatDateLabel(feed.lastFetchedAt)
                        : "未更新"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      bulkRefreshState.isRunning || refreshingFeedIds.includes(feed.id)
                    }
                    onClick={() => handleRefreshFeed(feed.id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {refreshingFeedIds.includes(feed.id) ? "更新中..." : "更新"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFeed(feed.id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    削除
                  </button>
                </div>
              </div>
              {feedErrors[feed.id] ? (
                <p className="mt-3 text-sm text-rose-600">{feedErrors[feed.id]}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
