"use client";

import { useMemo, useState } from "react";

import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SortSelector } from "@/components/SortSelector";
import { useReaderStore } from "@/hooks/useReaderStore";
import { sortArticles } from "@/lib/article-utils";
import type { ArticleSort } from "@/lib/types";

export function ArticleListScreen() {
  const { articles, readArticleIds, savedArticles, toggleSavedArticle, isHydrated } =
    useReaderStore();
  const [sort, setSort] = useState<ArticleSort>("newest");

  const sortedArticles = useMemo(() => sortArticles(articles, sort), [articles, sort]);

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  if (sortedArticles.length === 0) {
    return (
      <EmptyState
        title="記事がまだありません"
        description="まずはフィードを登録すると、ここに記事一覧が表示されます。"
        actionHref="/feeds"
        actionLabel="フィードを管理する"
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{sortedArticles.length}件の記事</p>
        <SortSelector value={sort} onChange={setSort} />
      </div>
      <div className="space-y-3">
        {sortedArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            isSaved={savedArticles.some((savedArticle) => savedArticle.id === article.id)}
            isRead={readArticleIds.includes(article.id)}
            onToggleSave={toggleSavedArticle}
          />
        ))}
      </div>
    </section>
  );
}
