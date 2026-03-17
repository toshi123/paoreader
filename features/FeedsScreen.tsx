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

  async function handleRefreshFeed(feedId: string) {
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

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  return (
    <section className="space-y-4">
      <FeedForm onSubmit={addFeed} />
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
              <div className="flex items-start justify-between gap-3">
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
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    disabled={refreshingFeedIds.includes(feed.id)}
                    onClick={() => handleRefreshFeed(feed.id)}
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {refreshingFeedIds.includes(feed.id) ? "更新中..." : "更新"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFeed(feed.id)}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-200"
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
