import type { ApiErrorResponse } from "@/lib/types";

type HatenaCountResponse = {
  url: string;
  count: number | null;
};

export async function fetchHatenaCountFromApi(url: string): Promise<number | null> {
  const response = await fetch(`/api/hatena-count?url=${encodeURIComponent(url)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as HatenaCountResponse | ApiErrorResponse;

  if (!response.ok) {
    return null;
  }

  if ("count" in payload) {
    return payload.count;
  }

  return null;
}
