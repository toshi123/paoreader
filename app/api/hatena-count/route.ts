import { NextResponse } from "next/server";

import { fetchHatenaCount } from "@/lib/hatena";
import { isValidUrl } from "@/lib/url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim() ?? "";

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "有効な記事 URL を指定してください。" },
      { status: 400 },
    );
  }

  const count = await fetchHatenaCount(url);

  return NextResponse.json({
    count,
    note: "現在はダミー応答です。今後は外部 API もしくはキャッシュレイヤを経由して取得します。",
  });
}
