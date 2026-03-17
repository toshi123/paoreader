"use client";

import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useReaderStore } from "@/hooks/useReaderStore";

export function SavedArticlesScreen() {
  const { savedArticles, readArticleIds, toggleSavedArticle, isHydrated } =
    useReaderStore();

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  if (savedArticles.length === 0) {
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
      {savedArticles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isSaved
          isRead={readArticleIds.includes(article.id)}
          onToggleSave={toggleSavedArticle}
        />
      ))}
    </section>
  );
}
