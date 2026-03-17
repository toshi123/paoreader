# PaoReader

PaoReader は、個人利用向けのモバイルファースト RSS リーダーです。
現在は Next.js + TypeScript + Tailwind CSS を使い、実際の RSS / Atom フィードを登録して記事一覧を表示できる MVP を構築しています。

## 現在の構成

```text
app/
  api/
    extract-article/
    fetch-feed/
    hatena-count/
  article/[id]/
  feeds/
  saved/
components/
features/
hooks/
lib/
```

## できること

- `/` で登録済みフィードの記事一覧を表示
- `/feeds` で RSS / Atom フィードを追加・削除
- `/saved` で保存記事を一覧表示
- `/article/[id]` で記事詳細を表示
- `/api/fetch-feed` で RSS / Atom を取得して解析
- LocalStorage に以下を保存
  - 購読フィード一覧
  - 取得済み記事一覧
  - 保存記事一覧
  - 既読記事 ID

## フィード追加の流れ

1. `/feeds` で URL を入力
2. `/api/fetch-feed?url=...` が対象フィードを取得
3. RSS または Atom を解析してフィード情報と記事一覧を返却
4. フィード情報と記事一覧を LocalStorage に保存
5. `/` で登録済みフィードの記事を新着順で表示

## エラーハンドリング

- `http` / `https` 以外の URL は拒否
- フィード取得失敗時は API / UI の両方でエラー表示
- RSS / Atom 解析失敗時も画面全体は落とさず、フォーム上でメッセージ表示
- 重複 URL の登録は防止

## 設計方針

- UI はスマホファースト
- 保存層は `ReaderStorage` インターフェースで抽象化
- RSS 取得、XML 解析、はてブ件数取得、本文抽出、URL 処理、保存処理、型定義を `lib` へ分離
- `feeds` / `articles` / `savedArticles` / `readArticleIds` を LocalStorage で管理
- API Route は後から Cloudflare Functions / D1 / KV へ置き換えやすい責務に整理

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

## 今後の拡張候補

- 定期更新や手動更新の導入
- Cloudflare Functions 経由の API 最適化
- Cloudflare D1 / KV への保存層差し替え
- 記事検索、タグ、既読フィルタ
- Android アプリ化を見据えた API / domain 層の再整理
