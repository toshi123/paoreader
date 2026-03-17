import type {
  ApiErrorResponse,
  FeedFetchResponse,
  FeedSelectionResult,
} from "@/lib/types";

export async function fetchFeedFromApi(url: string): Promise<FeedFetchResponse> {
  const response = await fetch(`/api/fetch-feed?url=${encodeURIComponent(url)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as FeedFetchResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      "error" in payload ? payload.error : "フィードの取得に失敗しました。",
    );
  }

  if ("feed" in payload && "articles" in payload) {
    return payload;
  }

  if (isFeedSelectionResult(payload)) {
    return payload;
  }

  throw new Error("フィード応答の形式が不正です。");
}

function isFeedSelectionResult(payload: unknown): payload is FeedSelectionResult {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const candidatePayload = payload as Partial<FeedSelectionResult>;

  return (
    candidatePayload.requiresSelection === true &&
    typeof candidatePayload.siteUrl === "string" &&
    Array.isArray(candidatePayload.candidates)
  );
}
