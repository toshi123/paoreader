import { NextResponse } from "next/server";

import { fetchHatenaCount } from "@/lib/hatena";
import { isValidUrl, normalizeUrl } from "@/lib/url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim() ?? "";

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "有効な記事 URL を指定してください。" },
      { status: 400 },
    );
  }

  const normalizedUrl = normalizeUrl(url);
  const count = await fetchHatenaCount(normalizedUrl);

  return NextResponse.json({
    url: normalizedUrl,
    count,
  });
}
