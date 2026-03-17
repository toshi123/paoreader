"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ExternalArticleLink } from "@/components/ExternalArticleLink";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SaveButton } from "@/components/SaveButton";
import { useReaderStore } from "@/hooks/useReaderStore";
import { extractArticleContent } from "@/lib/article-extractor";
import { formatDateLabel } from "@/lib/article-utils";
import type { ArticleContent } from "@/lib/types";
import { getHatenaEntryUrl, shouldUseFallbackThumbnail } from "@/lib/url";

const FALLBACK_THUMBNAIL_URL = "/images/usagi.png";

type ArticleDetailScreenProps = {
  articleId: string;
};

export function ArticleDetailScreen({ articleId }: ArticleDetailScreenProps) {
  const {
    allArticles,
    isArticleSaved,
    toggleSavedArticle,
    markArticleAsRead,
    isHydrated,
  } = useReaderStore();
  const [content, setContent] = useState<ArticleContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const article = useMemo(
    () => allArticles.find((currentArticle) => currentArticle.id === articleId),
    [allArticles, articleId],
  );

  useEffect(() => {
    if (!article) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const currentArticle = article;

    markArticleAsRead(currentArticle.id);

    let isMounted = true;

    async function loadContent() {
      const nextContent = await extractArticleContent(currentArticle.link);

      if (!isMounted) {
        return;
      }

      setContent(nextContent);
      setIsLoading(false);
    }

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, [article, markArticleAsRead]);

  if (!isHydrated || isLoading) {
    return <LoadingSpinner />;
  }

  if (!article) {
    return (
      <EmptyState
        title="記事が見つかりません"
        description="記事一覧に戻って別の記事を選択してください。"
        actionHref="/"
        actionLabel="記事一覧へ戻る"
      />
    );
  }

  const isSaved = isArticleSaved(article);
  const articleBody = content?.content.trim() ? content.content : article.summary;
  const thumbnailSrc = shouldUseFallbackThumbnail(article.link)
    ? FALLBACK_THUMBNAIL_URL
    : article.thumbnailUrl ?? FALLBACK_THUMBNAIL_URL;

  return (
    <article className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          <span>{article.feedTitle}</span>
          <span>{formatDateLabel(article.publishedAt)}</span>
          <Link
            href={getHatenaEntryUrl(article.link)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-sky-50 px-2 py-1 text-sky-700 transition hover:bg-sky-100"
            aria-label="はてなブックマークのコメントページを開く"
          >
            B! {article.hatenaBookmarkCount ?? "-"}
          </Link>
        </div>
        <h2 className="text-2xl font-semibold leading-9 text-slate-900">{article.title}</h2>
        <p className="text-sm leading-7 text-slate-600">{article.summary}</p>
        <Link
          href={article.link}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          aria-label="元記事を開く"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailSrc}
            alt={article.title}
            className="max-h-[28rem] w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_THUMBNAIL_URL;
            }}
          />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SaveButton isSaved={isSaved} onClick={() => toggleSavedArticle(article)} />
        <ExternalArticleLink href={article.link} variant="primary" />
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-5">
        <div className="space-y-1 text-sm text-slate-500">
          <p>{content?.siteName ?? article.feedTitle}</p>
          {content?.author ? <p>{content.author}</p> : null}
        </div>
        <div className="space-y-4 text-[15px] leading-8 text-slate-800">
          {articleBody.split("\n\n").map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
