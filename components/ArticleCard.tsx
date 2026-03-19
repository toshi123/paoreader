"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { SaveButton } from "@/components/SaveButton";
import { formatDateLabel } from "@/lib/article-utils";
import { getHatenaEntryUrl, shouldUseFallbackThumbnail } from "@/lib/url";
import type { Article } from "@/lib/types";

const FALLBACK_THUMBNAIL_URL = "/images/usagi.png";

type ArticleCardProps = {
  article: Article;
  isSaved: boolean;
  isRead: boolean;
  onToggleSave: (article: Article) => void;
  onOpenExternalArticle: (articleId: string) => void;
  onMarkAsRead: (articleId: string) => void;
  enableReadControls?: boolean;
};

export function ArticleCard({
  article,
  isSaved,
  isRead,
  onToggleSave,
  onOpenExternalArticle,
  onMarkAsRead,
  enableReadControls = false,
}: ArticleCardProps) {
  const resolvedThumbnailUrl = article.thumbnailUrl?.trim();
  const thumbnailSrc = shouldUseFallbackThumbnail(article.link)
    ? FALLBACK_THUMBNAIL_URL
    : resolvedThumbnailUrl || FALLBACK_THUMBNAIL_URL;
  const touchStartXRef = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function handleMarkAsRead() {
    onMarkAsRead(article.id);
  }

  function isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && Boolean(target.closest("a, button"));
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    if (!enableReadControls || isRead || isInteractiveTarget(event.target)) {
      return;
    }

    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    setIsDragging(true);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    if (!enableReadControls || isRead || touchStartXRef.current === null) {
      return;
    }

    const currentX = event.touches[0]?.clientX;

    if (typeof currentX !== "number") {
      return;
    }

    const deltaX = currentX - touchStartXRef.current;

    if (deltaX < 0) {
      setSwipeOffset(Math.max(deltaX, -96));
    } else {
      setSwipeOffset(0);
    }
  }

  function resetSwipeState() {
    touchStartXRef.current = null;
    setSwipeOffset(0);
    setIsDragging(false);
  }

  function handleTouchEnd() {
    if (!enableReadControls || isRead) {
      resetSwipeState();
      return;
    }

    if (swipeOffset <= -72) {
      handleMarkAsRead();
    }

    resetSwipeState();
  }

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {enableReadControls && !isRead ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <span className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
            左スワイプで既読
          </span>
        </div>
      ) : null}
      <div
        className="relative bg-white p-4"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? "none" : "transform 180ms ease",
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span>{article.feedTitle}</span>
            <span>{formatDateLabel(article.publishedAt)}</span>
            {isRead ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                既読
              </span>
            ) : (
              <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">未読</span>
            )}
          </div>
          <Link href={`/article/${article.id}`} className="block">
            <h2 className="text-base font-semibold leading-6 text-slate-900">
              {article.title}
            </h2>
          </Link>
        </div>
          {enableReadControls ? (
            <button
              type="button"
              onClick={handleMarkAsRead}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="未読の記事を既読にする"
            >
              ×
            </button>
          ) : null}
        </div>
        <Link
          href={article.link}
          target="_blank"
          rel="noreferrer"
          className="mb-4 block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          aria-label="元記事を開く"
          onClick={() => onOpenExternalArticle(article.id)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailSrc}
            alt={article.title}
            className="h-48 w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_THUMBNAIL_URL;
            }}
          />
        </Link>
        <p className="text-sm leading-6 text-slate-600">{article.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/article/${article.id}`}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            詳細
          </Link>
          <SaveButton
            isSaved={isSaved}
            onClick={() => onToggleSave(article)}
            savedLabel="保存済み"
            unsavedLabel="保存"
          />
          <Link
            href={getHatenaEntryUrl(article.link)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            aria-label="はてなブックマークのコメントページを開く"
          >
            B! {article.hatenaBookmarkCount ?? "-"}
          </Link>
        </div>
      </div>
    </article>
  );
}
