"use client";

import { useMemo } from "react";

import { ArticleFilters } from "@/components/ArticleFilters";
import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SortSelector } from "@/components/SortSelector";
import { useArticleListPreferences } from "@/hooks/useArticleListPreferences";
import { useReaderStore } from "@/hooks/useReaderStore";
import { filterArticles, sortArticles } from "@/lib/article-utils";

export function ArticleListScreen() {
  const {
    articles,
    readArticleIds,
    isArticleSaved,
    toggleSavedArticle,
    markArticleAsRead,
    isHydrated,
  } = useReaderStore();
  const { preferences, setSort, setReadFilter, toggleSavedOnly } =
    useArticleListPreferences(isHydrated);

  const filteredArticles = useMemo(() => {
    return filterArticles(articles, {
      readFilter: preferences.readFilter,
      readArticleIds,
      savedOnly: preferences.savedOnly,
      isArticleSaved,
    });
  }, [articles, isArticleSaved, preferences.readFilter, preferences.savedOnly, readArticleIds]);

  const sortedArticles = useMemo(
    () => sortArticles(filteredArticles, preferences.sort),
    [filteredArticles, preferences.sort],
  );

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  if (articles.length === 0) {
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
      <ArticleFilters
        readFilter={preferences.readFilter}
        savedOnly={preferences.savedOnly}
        onChangeReadFilter={setReadFilter}
        onToggleSavedOnly={toggleSavedOnly}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{sortedArticles.length}件の記事</p>
        <SortSelector value={preferences.sort} onChange={setSort} />
      </div>
      {sortedArticles.length === 0 ? (
        <EmptyState
          title="条件に合う記事がありません"
          description="フィルタ条件を変えると、別の記事が表示される場合があります。"
        />
      ) : null}
      <div className="space-y-3">
        {sortedArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            isSaved={isArticleSaved(article)}
            isRead={readArticleIds.includes(article.id)}
            onToggleSave={toggleSavedArticle}
            onMarkAsRead={markArticleAsRead}
            enableReadControls
          />
        ))}
      </div>
    </section>
  );
}
