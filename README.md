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
- `/` で未読 / 既読 / 保存済みの絞り込み
- `/` で新着順 / はてブ順の並び替え
- `/` のフィルタ状態を再読み込み後も復元
- `/feeds` で RSS / Atom フィードを追加・削除・再取得・一括更新
- `/saved` で保存記事を一覧表示
- `/article/[id]` で記事詳細を表示
- 記事を「あとで読む」に保存 / 解除
- 記事カードと詳細から元記事を外部リンクで開く
- `/api/fetch-feed` で RSS / Atom を取得して解析
- `/api/hatena-count` ではてなブックマーク件数を取得
- RSS / Atom の `media:thumbnail` などから記事サムネイル画像を抽出
- PWA の最低限の土台として `manifest.json` と仮アイコンを配置
- LocalStorage に以下を保存
  - 購読フィード一覧
  - 取得済み記事一覧
  - 保存記事一覧
  - 既読記事 ID

## フィード追加の流れ

1. `/feeds` でサイト URL またはフィード URL を入力
2. `/api/fetch-feed?url=...` が URL を取得
3. サイト URL の場合は HTML のメタデータから RSS / Atom を自動検出
4. 候補が複数ある場合は、登録したいフィードを選択
5. RSS または Atom を解析してフィード情報と記事一覧を返却
6. フィード情報と記事一覧を LocalStorage に保存
7. `/` で登録済みフィードの記事を新着順で表示

## 主な使い方

1. `/feeds` で RSS / Atom フィードを追加する
2. `/` で記事を見つける
3. 気になる記事を保存する
4. 詳細または一覧カードから元記事を開く
5. 必要に応じて `未読 / 既読 / 保存済み` や `はてブ順` で絞り込む

## あとで読むと再取得

- 記事一覧と記事詳細から保存 / 解除が可能
- 保存済み記事は LocalStorage に保持され、再読み込み後も残る
- 購読フィードを削除しても、保存済み記事は `/saved` から閲覧可能
- `/feeds` ではフィードごとに再取得でき、`lastFetchedAt` を表示
- `/feeds` では全フィード一括更新が可能で、進捗と成功 / 失敗件数を表示
- 再取得時は URL 正規化ベースで記事重複を抑制

## 記事一覧フィルタ

- 初回表示のデフォルトは「未読」のみ
- 未読 / 既読 / すべて を切り替え可能
- 保存済みのみを追加条件として併用可能
- フィルタ状態と並び順は再読み込み後も復元
- はてなブックマーク件数を小さく表示
- はてブ順では件数の多い順、同数なら新しい記事を優先
- 記事詳細を開くと既読状態を保持
- 一覧上でも既読 / 未読をラベルで視認可能

## はてなブックマーク件数

- 記事 URL を正規化して `/api/hatena-count` から取得
- 件数は LocalStorage 上の記事キャッシュへ保存
- 未取得時は `-` を表示
- 取得失敗時は `null` 扱いで静かに degrade し、一覧全体は止めない

## PWA の土台

- `public/manifest.json` を配置
- 仮アイコンを `public/icons/` に配置
- ホーム画面追加向けの最低限の metadata を設定
- 完全なオフライン対応や service worker はまだ未実装

## 現時点で優先していないこと

- 記事本文抽出の本実装
- 完全なオフライン対応
- Cloudflare 固有設定の作り込み

## エラーハンドリング

- `http` / `https` 以外の URL は拒否
- フィード取得失敗時は API / UI の両方でエラー表示
- RSS / Atom 解析失敗時も画面全体は落とさず、フォーム上でメッセージ表示
- サムネイル URL は `media:thumbnail` -> `media:content` -> `enclosure(image/*)` -> `content:encoded` 内の最初の `img` -> `description` 内の最初の `img` の順で抽出
- 相対サムネイル URL はフィード URL またはサイト URL を基準に絶対 URL 化し、不正な URL は無視
- 重複 URL の登録は防止
- フィード再取得失敗時は対象フィードの行にだけエラー表示

## 設計方針

- UI はスマホファースト
- 保存層は `ReaderStorage` インターフェースで抽象化
- RSS 取得、XML 解析、はてブ件数取得、本文抽出、URL 処理、保存処理、型定義を `lib` へ分離
- `feeds` / `articles` / `savedArticles` / `readArticleIds` を LocalStorage で管理
- 保存判定と記事重複判定は URL 正規化ベースで処理
- API Route は後から Cloudflare Functions / D1 / KV へ置き換えやすい責務に整理

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

## 今後の拡張候補

- 定期更新の導入
- Cloudflare Functions 経由の API 最適化
- Cloudflare D1 / KV への保存層差し替え
- 記事検索、タグ
- 本文抽出の再設計
- Android アプリ化を見据えた API / domain 層の再整理
