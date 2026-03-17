import { NextResponse } from "next/server";

import { FeedFetchError, fetchFeed } from "@/lib/rss";
import { isValidUrl } from "@/lib/url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim() ?? "";

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "有効な http / https のサイト URL またはフィード URL を指定してください。" },
      { status: 400 },
    );
  }

  try {
    const result = await fetchFeed(url);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FeedFetchError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "フィード処理中に予期しないエラーが発生しました。" },
      { status: 500 },
    );
  }
}
