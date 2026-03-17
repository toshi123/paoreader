export type Feed = {
  id: string;
  title: string;
  url: string;
  siteUrl?: string;
  description?: string;
  articleCount?: number;
  createdAt: string;
  lastFetchedAt?: string;
};

export type Article = {
  id: string;
  feedId: string;
  feedTitle: string;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
  thumbnailUrl?: string;
  hatenaBookmarkCount: number | null;
  hatenaCountFetchedAt?: string;
};

export type ArticleContent = {
  articleId: string;
  title: string;
  url: string;
  siteName?: string;
  author?: string;
  excerpt?: string;
  content: string;
  publishedAt?: string;
};

export type ArticleSort = "newest" | "hatena";
export type ArticleReadFilter = "all" | "unread" | "read";

export type FeedFetchResult = {
  feed: Feed;
  articles: Article[];
};

export type ApiErrorResponse = {
  error: string;
};

export type ArticleListPreferences = {
  sort: ArticleSort;
  readFilter: ArticleReadFilter;
  savedOnly: boolean;
};
