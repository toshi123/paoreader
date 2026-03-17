import { NextResponse } from "next/server";

import { extractArticleContent } from "@/lib/article-extractor";
import { isValidUrl } from "@/lib/url";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string };
  const url = body.url?.trim() ?? "";

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "有効な記事 URL を指定してください。" },
      { status: 400 },
    );
  }

  const articleContent = await extractArticleContent(url);

  return NextResponse.json({
    articleContent,
    note: "現在はダミー応答です。今後は本文抽出ロジックや Reader Mode 互換処理をここへ接続します。",
  });
}
