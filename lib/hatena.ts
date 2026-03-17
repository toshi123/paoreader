import { normalizeUrl } from "@/lib/url";

type HatenaEntryResponse = {
  count?: number;
};

export async function fetchHatenaCount(url: string): Promise<number | null> {
  const normalizedUrl = normalizeUrl(url);

  try {
    const response = await fetch(
      `https://b.hatena.ne.jp/entry/jsonlite/?url=${encodeURIComponent(normalizedUrl)}`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as HatenaEntryResponse | null;

    if (!payload || typeof payload.count !== "number") {
      return 0;
    }

    return payload.count;
  } catch {
    return null;
  }
}
