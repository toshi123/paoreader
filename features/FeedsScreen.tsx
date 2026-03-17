"use client";

import { EmptyState } from "@/components/EmptyState";
import { FeedForm } from "@/components/FeedForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useReaderStore } from "@/hooks/useReaderStore";

export function FeedsScreen() {
  const { feeds, addFeed, removeFeed, isHydrated } = useReaderStore();

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
                  <p className="text-xs text-slate-400">
                    {feed.articleCount ?? 0}件の記事を取得
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFeed(feed.id)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-200"
                >
                  削除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
