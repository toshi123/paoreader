import type { ApiErrorResponse, FeedFetchResult } from "@/lib/types";

export async function fetchFeedFromApi(url: string): Promise<FeedFetchResult> {
  const response = await fetch(`/api/fetch-feed?url=${encodeURIComponent(url)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as FeedFetchResult | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      "error" in payload ? payload.error : "フィードの取得に失敗しました。",
    );
  }

  if ("feed" in payload && "articles" in payload) {
    return payload;
  }

  throw new Error("フィード応答の形式が不正です。");
}
