import Link from "next/link";

import { ExternalArticleLink } from "@/components/ExternalArticleLink";
import { SaveButton } from "@/components/SaveButton";
import { formatDateLabel } from "@/lib/article-utils";
import { getHatenaEntryUrl } from "@/lib/url";
import type { Article } from "@/lib/types";

type ArticleCardProps = {
  article: Article;
  isSaved: boolean;
  isRead: boolean;
  onToggleSave: (article: Article) => void;
};

export function ArticleCard({
  article,
  isSaved,
  isRead,
  onToggleSave,
}: ArticleCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
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
        <SaveButton isSaved={isSaved} onClick={() => onToggleSave(article)} />
      </div>
      <p className="text-sm leading-6 text-slate-600">{article.summary}</p>
      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/article/${article.id}`}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          詳細を見る
        </Link>
        <ExternalArticleLink href={article.link} label="元記事" />
      </div>
    </article>
  );
}
