"use client";

import { useMemo } from "react";

import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useReaderStore } from "@/hooks/useReaderStore";
import { sortArticles } from "@/lib/article-utils";

export function SavedArticlesScreen() {
  const {
    allArticles,
    isArticleSaved,
    readArticleIds,
    toggleSavedArticle,
    markArticleAsRead,
    isHydrated,
  } = useReaderStore();
  const sortedSavedArticles = useMemo(
    () => sortArticles(allArticles.filter((article) => isArticleSaved(article)), "newest"),
    [allArticles, isArticleSaved],
  );

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  if (sortedSavedArticles.length === 0) {
    return (
      <EmptyState
        title="あとで読むは空です"
        description="記事一覧から気になる記事を保存すると、ここにまとまります。"
        actionHref="/"
        actionLabel="記事一覧を見る"
      />
    );
  }

  return (
    <section className="space-y-3">
      {sortedSavedArticles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isSaved
          isRead={readArticleIds.includes(article.id)}
          onToggleSave={toggleSavedArticle}
          onOpenExternalArticle={markArticleAsRead}
        />
      ))}
    </section>
  );
}
