# x402 Explorer システム仕様書

> 本書はコードベース v1.0.0 時点のシステム仕様を記載する。

---

## 1. アーキテクチャ概要

### 1.1 レイヤー構成

```
┌──────────────────────────────────────────────────────────────┐
│  Client 層     Browser                                       │
├──────────────────────────────────────────────────────────────┤
│  Frontend 層   Cloudflare Pages — Next.js 14 (Edge Runtime)  │
├──────────────────────────────────────────────────────────────┤
│  API 層        Cloudflare Workers — Hono 4                   │
├──────────────────────────────────────────────────────────────┤
│  Data 層       Cloudflare D1 (SQLite)                        │
├──────────────────────────────────────────────────────────────┤
│  External 層   Helius Enhanced API → Solana Network          │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 通信フロー

| 経路 | プロトコル | 内容 |
|------|-----------|------|
| Browser → Pages | HTTPS | SSR ページ取得 + CSR ナビゲーション |
| Pages (SSR) → Workers | HTTPS (fetch) | API データ取得 (`cache: "no-store"`) |
| Browser → Workers | HTTPS (fetch) | SubmitForm からの POST |
| Workers → D1 | D1 Binding (内部) | SQL クエリ（パラメタライズド） |
| Workers → Helius | HTTPS | Enhanced Transaction API / JSON-RPC |
| Helius → Workers | HTTPS (Webhook) | 決済トランザクション通知 |
| Helius → Solana | RPC | オンチェーンデータ取得 |

### 1.3 本番 URL

| サービス | URL |
|----------|-----|
| Web (Pages) | `https://x402explorer.fracturelab.dev` |
| API (Worker) | `https://x402explorer-api.fracturelab.dev` |
| Pages preview | `https://x402-explorer-web.pages.dev` |

---

## 2. 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| ランタイム | Node.js | 20.11.1 |
| パッケージマネージャ | pnpm | 9.12.0 |
| モノレポ管理 | Turborepo | ^2.1.0 |
| 言語 | TypeScript | ^5.5.4 |
| フロントエンド | Next.js (App Router) | 14.2.13 |
| CSS | Tailwind CSS | ^3.4.12 |
| チャート | Recharts | ^2.13.0 |
| バックエンド | Hono | ^4.6.3 |
| バリデーション | Zod | ^3.23.8 |
| データベース | Cloudflare D1 (SQLite) | — |
| Solana RPC | Helius Enhanced API | v0 |
| ホスティング (Web) | Cloudflare Pages | — |
| ホスティング (API) | Cloudflare Workers | — |
| Pages アダプタ | @cloudflare/next-on-pages | 1.13.16 |
| パッケージビルド | tsup | ^8.2.4 |
| テスト | Vitest | ^2.1.9 |
| フォーマッタ | Prettier | ^3.3.3 |

---

## 3. モノレポ構成

```
x402Explorer/
├── apps/
│   ├── web/            # Next.js 14 App Router + Tailwind v3  (port 3000)
│   └── worker/         # Cloudflare Workers + Hono + D1       (port 8787)
├── packages/
│   ├── shared/         # @x402/shared — Zod スキーマ + 型定義
│   └── helius/         # @x402/helius — Helius API クライアント
├── scripts/
│   └── devnet-cycle.ts # デモ用決済ループスクリプト
└── docs/
    ├── 1_Plan.md       # 企画書
    ├── 2_SystemSpec.md # 本書
    └── 3_EnvironmentSetup.md  # 環境構築・運用ガイド
```

### 3.1 パッケージ依存関係

```
@x402/shared  ←─── @x402/helius
     ↑                  ↑
     │                  │
  apps/web          apps/worker
```

- `@x402/shared` は他のすべてのパッケージ / アプリから参照される
- `@x402/helius` は `@x402/shared` に依存し、`apps/worker` から利用される
- `apps/web` は `@x402/shared` のみ利用（Helius クライアントは直接使わない）

### 3.2 ビルド順序（Turborepo）

```
1. packages/shared   → dist/ (ESM + CJS + DTS)
2. packages/helius   → dist/ (ESM + CJS + DTS, external: @x402/shared)
3. apps/worker       → dist/ (wrangler build)
4. apps/web          → .next/ (next build)
```

`turbo.json` の `dependsOn: ["^build"]` により、依存パッケージのビルドが先行する。

---

## 4. コンポーネント仕様

### 4.1 Worker API (`apps/worker`)

#### 4.1.1 フレームワーク構成

- **Web フレームワーク**: Hono 4
- **エントリーポイント**: `src/index.ts`
- **ルーティング**: `app.route()` でサブルーター分割
- **ミドルウェア**: CORS（全ルート適用）

```typescript
// CORS 設定
cors({
  origin: ALLOWED_ORIGIN (カンマ区切り対応) | "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
})
```

#### 4.1.2 環境バインディング

```typescript
interface Env {
  DB: D1Database;                              // Cloudflare D1
  HELIUS_API_KEY: string;                      // Helius API キー
  HELIUS_NETWORK: "devnet" | "mainnet-beta";   // ネットワーク
  HELIUS_WEBHOOK_SECRET: string;               // Webhook 認証シークレット
  ALLOWED_ORIGIN: string;                      // CORS 許可オリジン
}
```

#### 4.1.3 ルート一覧

| パス | メソッド | ルーター | 概要 |
|------|---------|---------|------|
| `/` | GET | root | サービス名・ステータス返却 |
| `/health` | GET | healthRoute | ヘルスチェック（D1 接続 + Helius 設定確認） |
| `/apis` | POST | apisRoute | API 登録（x402 検証付き） |
| `/apis` | GET | apisRoute | API 一覧取得（フィルタ・ページネーション） |
| `/apis/stats` | GET | apisRoute | 全 API の決済統計 |
| `/apis/:id` | GET | apisRoute | API 詳細取得 |
| `/apis/:id/stats` | GET | apisRoute | 個別 API の決済統計 |
| `/payments/webhook` | POST | paymentsRoute | Helius Webhook 受信 |
| `/payments` | GET | paymentsRoute | 決済一覧取得 |

#### 4.1.4 DB ヘルパー (`src/lib/db.ts`)

データベース行 → API レスポンス型への変換関数:

| 関数 | 入力 | 出力 |
|------|------|------|
| `rowToApiListing(row)` | `ApiRow` (snake_case) | `ApiListing` (camelCase) |
| `rowToPayment(row)` | `PaymentRow` (snake_case) | `Payment` (camelCase) |
| `rowToApiStats(row)` | `ApiStatsRow` | `ApiStats` |

#### 4.1.5 402 検証ロジック (`src/lib/verify402.ts`)

**URL バリデーション (`validateUrl`)**:

- HTTPS のみ許可（HTTP はブロック）
- プライベート / ループバックホストをブロック:
  - `localhost`, `127.*`, `10.*`, `192.168.*`, `169.254.*`
  - `172.16.0.0/12` (`172.16.*` ～ `172.31.*`)
  - IPv6 ループバック: `::1`, `[::1]`

**402 レスポンス検証 (`verify402`)**:

1. 対象 URL に GET リクエスト送信（タイムアウト: 10 秒）
2. HTTP 402 ステータスを確認
3. レスポンスボディを JSON パース（最大 64 KB）
4. `X402ChallengeSchema` でバリデーション
5. `accepts[]` から Solana ネットワークエントリを抽出
6. `payTo`（ウォレット）、`maxAmountRequired`（価格）、`asset`（トークン）を返却

**非同期検証フロー (`runVerification`)**:

```
POST /apis → status="pending" で INSERT
          → waitUntil(runVerification) で非同期実行
              → status を "verifying" に UPDATE
              → verify402() 実行
              → 成功: status="approved", wallet/price/token を UPDATE
              → 失敗: status="rejected" に UPDATE
```

#### 4.1.6 Webhook 認証 (`src/lib/webhook-auth.ts`)

- `Authorization: Bearer <secret>` ヘッダーを検証
- **タイミングセーフ比較**を実装（タイミング攻撃を防止）
- 文字列長不一致でも全バイトを比較して終了

### 4.2 Web Frontend (`apps/web`)

#### 4.2.1 ページ一覧

| ルート | ファイル | ランタイム | 概要 |
|--------|---------|----------|------|
| `/` | `src/app/page.tsx` | Edge | ホーム — API グリッド + 統計バー |
| `/apis/[id]` | `src/app/apis/[id]/page.tsx` | Edge | API 詳細 — 統計 + 決済履歴テーブル |
| `/map` | `src/app/map/page.tsx` | Edge | エコマップ — Recharts 散布図 |
| `/submit` | `src/app/submit/page.tsx` | Edge | 申請フォーム |
| (レイアウト) | `src/app/layout.tsx` | Edge | ルートレイアウト — フォント、Navbar、Footer |

全ページ: `export const runtime = "edge"` + `export const dynamic = "force-dynamic"`

#### 4.2.2 コンポーネント一覧

| コンポーネント | 種別 | 概要 |
|--------------|------|------|
| `Navbar` | Client | スティッキーヘッダー、アクティブルート表示、グラスモーフィズム |
| `Footer` | Server | リンク集（x402.org, Helius, Solana） |
| `ApiCard` | Server | API カード（カテゴリアクセントカラー付き、ホバーグロー） |
| `GlowCard` | Server | 汎用グローカード（hover glow オプション） |
| `GradientText` | Server | 紫→緑グラデーションテキスト |
| `StatusBadge` | Server | ステータスバッジ（パルスドット付き） |
| `SubmitForm` | Client | API 登録フォーム（Worker に POST） |
| `NetworkToggle` | Client | devnet / mainnet-beta 切り替えトグル |
| `PaymentTable` | Server | 決済履歴テーブル（Solscan リンク付き） |
| `EcoMap` | Client | Recharts 散布図（Volume × Payment Count） |

#### 4.2.3 API クライアント (`src/lib/api.ts`)

ベース URL: `process.env.NEXT_PUBLIC_WORKER_URL`（デフォルト: `http://localhost:8787`）

| 関数 | エンドポイント | 戻り値 |
|------|-------------|--------|
| `getApis(params?)` | `GET /apis` | `ListResponse<ApiListing>` |
| `getApi(id)` | `GET /apis/{id}` | `SingleResponse<ApiListing>` |
| `getApiStats(params?)` | `GET /apis/stats` | `ApiStats[]` |
| `getApiStat(id)` | `GET /apis/{id}/stats` | `ApiStats \| null` |
| `getPayments(params?)` | `GET /payments` | `ListResponse<Payment>` |

レスポンスエンベロープ:
```typescript
ListResponse<T>   = { success: boolean, data: T[], meta: { total: number, page: number, limit: number } }
SingleResponse<T>  = { success: boolean, data: T }
```

#### 4.2.4 デザインシステム

**カラーパレット（Solana ブランド）**:

| トークン | 値 | 用途 |
|---------|-----|------|
| `solana-purple` | `#9945FF` | プライマリ、グラデーション開始色 |
| `solana-green` | `#14F195` | アクセント、グラデーション終了色 |
| `solana-teal` | `#00D18C` | 補助グリーン |
| `solana-dark` | `#0E0B16` | 背景色 |
| `solana-surface` | `#1A1425` | カード背景色 |
| `solana-border` | `#2D2640` | ボーダー色 |
| `solana-muted` | `#7C71A0` | テキスト（ミュート） |

**タイポグラフィ**:

| ロール | フォント |
|--------|---------|
| `font-sans` | Inter (Google Fonts) |
| `font-mono` | JetBrains Mono (Google Fonts) |

**CSS コンポーネントクラス** (`globals.css`):

| クラス | 概要 |
|--------|------|
| `.glass-card` | ボーダー + surface 背景 + backdrop-blur |
| `.gradient-text` | 紫→緑 clip-text グラデーション |
| `.glow-btn` | グラデーションボタン + ホバーグロー |
| `.input-field` | フォーム入力フィールド + フォーカスリング |

**アニメーション**:

| 名前 | 効果 | 時間 |
|------|------|------|
| `float` | Y 軸バウンス (-12px) | 6s |
| `pulse-glow` | スケール + 不透明度パルス | 2s |
| `fade-in` | 不透明度 0→1 | 0.6s |
| `slide-up` | Y 移動 + フェードイン | 0.5s |

### 4.3 @x402/shared (`packages/shared`)

共有 Zod スキーマと TypeScript 型定義。

#### 4.3.1 スキーマ一覧

**NetworkSchema** (`network.ts`):
```typescript
z.enum(["devnet", "mainnet-beta"])
type Network = "devnet" | "mainnet-beta"
```

**ApiStatusSchema** (`api-listing.ts`):
```typescript
z.enum(["pending", "verifying", "approved", "rejected", "disabled"])
```

**ApiListingSchema** (`api-listing.ts`):

| フィールド | 型 | バリデーション |
|-----------|-----|-------------|
| `id` | string | UUID |
| `url` | string | URL 形式 |
| `name` | string | 1〜120 文字 |
| `description` | string? | 最大 500 文字 |
| `category` | string? | 最大 60 文字 |
| `wallet` | string | 32〜48 文字（Solana base58） |
| `priceAmount` | string | 精度保持のため文字列 |
| `priceToken` | string | `"USDC"` またはミントアドレス |
| `network` | Network | `"devnet"` \| `"mainnet-beta"` |
| `status` | ApiStatus | 5 種のステータス |
| `createdAt` | string | ISO 8601 datetime |
| `updatedAt` | string | ISO 8601 datetime |

**CreateApiListingInputSchema** (`api-listing.ts`):

| フィールド | 型 | デフォルト |
|-----------|-----|----------|
| `url` | string | 必須（URL 形式） |
| `name` | string? | 省略時はホスト名 |
| `network` | Network | `"devnet"` |

**ApiStatsSchema** (`api-stats.ts`):

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `apiId` | string (UUID) | 対象 API |
| `totalVolume` | string | 決済合計金額（TEXT 精度保持） |
| `paymentCount` | number | 決済回数 |
| `lastPaymentAt` | string \| null | 最終決済日時 |
| `token` | string \| null | 最頻出トークン |

**PaymentSchema** (`payment.ts`):

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `signature` | string | Solana トランザクション署名（主キー） |
| `apiId` | string (UUID) | 紐づく API |
| `amount` | string | 決済金額（TEXT 精度保持） |
| `token` | string | トークン |
| `network` | Network | ネットワーク |
| `blockTime` | number | Unix 秒 |
| `slot` | number | Solana スロット |
| `fromAddress` | string | 送信者アドレス |
| `toAddress` | string | 受信者アドレス（= API ウォレット） |
| `createdAt` | string | ISO 8601 datetime |

**X402ChallengeSchema** (`x402.ts`):

```typescript
{
  x402Version?: number,
  accepts: Array<{
    scheme: string,
    network: string,
    maxAmountRequired: string,
    asset: string,
    payTo: string,
    resource?: string,
  }>
}
```

#### 4.3.2 テスト

`src/__tests__/schemas.test.ts` — Vitest による全スキーマのバリデーションテスト（205 行）:
- NetworkSchema: 有効値・無効値テスト
- ApiStatusSchema: 全 5 ステータステスト
- CreateApiListingInputSchema: URL、name、network デフォルト
- ApiStatsSchema: UUID、負数拒否、null 許容
- ApiListingSchema: 完全バリデーション、ウォレット長検証
- PaymentSchema: 完全バリデーション

### 4.4 @x402/helius (`packages/helius`)

Helius API クライアントライブラリ。

#### 4.4.1 エンドポイント URL (`endpoints.ts`)

| 関数 | devnet | mainnet-beta |
|------|--------|-------------|
| `rpcUrl(network, apiKey)` | `https://devnet.helius-rpc.com/?api-key={key}` | `https://mainnet.helius-rpc.com/?api-key={key}` |
| `enhancedTxUrl(network, address, apiKey)` | `https://api-devnet.helius.xyz/v0/addresses/{addr}/transactions?api-key={key}` | `https://api.helius.xyz/v0/addresses/{addr}/transactions?api-key={key}` |

#### 4.4.2 HeliusClient クラス

```typescript
class HeliusClient {
  constructor(opts: {
    apiKey: string;
    network: Network;
    fetchImpl?: typeof fetch;  // Workers / Node 両対応
  })

  getTransactionsForAddress(
    address: string,
    opts?: { limit?: number; before?: string }
  ): Promise<HeliusEnhancedTransaction[]>

  getSlot(): Promise<number>  // JSON-RPC getSlot（接続疎通確認用）
}
```

#### 4.4.3 型定義 (`types.ts`)

**HeliusRpcResponse\<T\>**:
```typescript
{ jsonrpc: "2.0", id: number, result: T, error?: { code: number, message: string } }
```

**HeliusEnhancedTransaction**:
```typescript
{
  signature: string, slot: number, timestamp: number,
  type: string, source: string, fee: number, feePayer: string,
  description?: string,
  tokenTransfers?: Array<{
    fromUserAccount: string, toUserAccount: string,
    fromTokenAccount: string, toTokenAccount: string,
    tokenAmount: number, mint: string
  }>,
  nativeTransfers?: Array<{
    fromUserAccount: string, toUserAccount: string, amount: number
  }>
}
```

---

## 5. データベーススキーマ

**データベース**: Cloudflare D1 (SQLite 互換)
**名前**: `x402_explorer_prod`
**マイグレーション**: `apps/worker/migrations/0001_init.sql`

### 5.1 テーブル: `apis`

API リスティングレジストリ。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| `id` | TEXT | PRIMARY KEY | UUID |
| `url` | TEXT | NOT NULL, UNIQUE | HTTPS エンドポイント URL |
| `name` | TEXT | NOT NULL | 表示名 |
| `description` | TEXT | — | 説明文 |
| `category` | TEXT | — | カテゴリ |
| `wallet` | TEXT | NOT NULL | Solana ウォレットアドレス |
| `price_amount` | TEXT | NOT NULL | 決済金額（精度保持のため TEXT） |
| `price_token` | TEXT | NOT NULL | `"USDC"` またはミントアドレス |
| `network` | TEXT | NOT NULL, CHECK | `"devnet"` \| `"mainnet-beta"` |
| `status` | TEXT | NOT NULL, CHECK | `"pending"` \| `"verifying"` \| `"approved"` \| `"rejected"` \| `"disabled"` |
| `created_at` | TEXT | NOT NULL, DEFAULT | ISO datetime (`datetime('now')`) |
| `updated_at` | TEXT | NOT NULL, DEFAULT | ISO datetime (`datetime('now')`) |

**インデックス**:
- `idx_apis_status_network` — `(status, network)`
- `idx_apis_wallet_network` — `(wallet, network)`

### 5.2 テーブル: `payments`

決済トランザクション記録。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| `signature` | TEXT | PRIMARY KEY | Solana トランザクション署名 |
| `api_id` | TEXT | NOT NULL, FK | `apis(id)` への外部キー |
| `amount` | TEXT | NOT NULL | 決済金額（精度保持のため TEXT） |
| `token` | TEXT | NOT NULL | トークンミントアドレス |
| `network` | TEXT | NOT NULL, CHECK | `"devnet"` \| `"mainnet-beta"` |
| `block_time` | INTEGER | NOT NULL | Unix 秒 |
| `slot` | INTEGER | NOT NULL | Solana スロット番号 |
| `from_address` | TEXT | NOT NULL | 送信者アドレス |
| `to_address` | TEXT | NOT NULL | 受信者アドレス（= API ウォレット） |
| `created_at` | TEXT | NOT NULL, DEFAULT | ISO datetime |

**外部キー**: `api_id → apis(id) ON DELETE CASCADE`

**インデックス**:
- `idx_payments_api_blocktime` — `(api_id, block_time DESC)`
- `idx_payments_network_blocktime` — `(network, block_time DESC)`

---

## 6. API エンドポイントリファレンス

### 6.1 `GET /`

サービス情報を返却する。

**レスポンス** `200`:
```json
{ "name": "x402-explorer-worker", "status": "ok" }
```

### 6.2 `GET /health`

ヘルスチェック。D1 接続と Helius 設定状態を返却する。

**レスポンス** `200`:
```json
{
  "ok": true,
  "service": "x402-explorer-worker",
  "timestamp": "2026-04-10T06:00:00.000Z",
  "d1": { "ok": true },
  "heliusKeyConfigured": true,
  "network": "devnet"
}
```

> `d1.error`（`string`）は D1 接続エラー時のみ出現する。正常時は省略される。

### 6.3 `POST /apis`

新規 API エンドポイントを登録する。登録後、非同期で HTTP 402 検証を実行する。

**リクエストボディ**:
```json
{
  "url": "https://example.com/api",
  "name": "My API",
  "network": "devnet"
}
```

| フィールド | 型 | 必須 | デフォルト | バリデーション |
|-----------|-----|------|----------|-------------|
| `url` | string | ✅ | — | URL 形式 |
| `name` | string | — | URL のホスト名 | 1〜120 文字 |
| `network` | string | — | `"devnet"` | `"devnet"` \| `"mainnet-beta"` |

**レスポンス** `202`:
```json
{ "success": true, "data": { "id": "uuid-here", "status": "pending" } }
```

**エラーレスポンス**:
- `400`: バリデーション失敗
- `409`: URL が既に登録済み

### 6.4 `GET /apis`

登録済み API の一覧を取得する。

**クエリパラメータ**:

| パラメータ | 型 | デフォルト | バリデーション |
|-----------|-----|----------|-------------|
| `status` | string | — | ApiStatus の値 |
| `network` | string | — | `"devnet"` \| `"mainnet-beta"` |
| `limit` | number | 20 | 1〜100 |
| `page` | number | 1 | 1 以上 |

**レスポンス** `200`:
```json
{
  "success": true,
  "data": [{ "id": "...", "url": "...", "name": "...", ... }],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
```

### 6.5 `GET /apis/stats`

全 API の決済統計集計を取得する。

**クエリパラメータ**:

| パラメータ | 型 | デフォルト |
|-----------|-----|----------|
| `network` | string | — (全ネットワーク) |

**レスポンス** `200`:
```json
{
  "success": true,
  "data": [
    {
      "apiId": "uuid",
      "totalVolume": "1.234000",
      "paymentCount": 15,
      "lastPaymentAt": "2026-04-10T06:00:00",
      "token": "USDC"
    }
  ]
}
```

**集計 SQL**:
```sql
SELECT
  api_id as apiId,
  COALESCE(printf('%.6f', SUM(CAST(amount AS REAL))), '0') as totalVolume,
  COUNT(*) as paymentCount,
  MAX(datetime(block_time, 'unixepoch')) as lastPaymentAt,
  (SELECT token FROM payments p2
   WHERE p2.api_id = payments.api_id
   GROUP BY token ORDER BY COUNT(*) DESC LIMIT 1) as token
FROM payments
GROUP BY api_id
```

### 6.6 `GET /apis/:id`

個別 API の詳細を取得する。

**レスポンス** `200`:
```json
{ "success": true, "data": { "id": "...", "url": "...", ... } }
```

**エラーレスポンス**: `404` — 存在しない場合

### 6.7 `GET /apis/:id/stats`

個別 API の決済統計を取得する。決済が存在しない場合もゼロ値を返却する。

**レスポンス** `200`:
```json
{
  "success": true,
  "data": {
    "apiId": "uuid",
    "totalVolume": "0",
    "paymentCount": 0,
    "lastPaymentAt": null,
    "token": null
  }
}
```

### 6.8 `POST /payments/webhook`

Helius Webhook からの決済トランザクション通知を受信する。

**認証**: `Authorization: Bearer <HELIUS_WEBHOOK_SECRET>`

**リクエストボディ**: `HeliusWebhookEntry[]`
```json
[
  {
    "signature": "5abc...xyz",
    "slot": 450000000,
    "timestamp": 1712736000,
    "tokenTransfers": [
      {
        "fromUserAccount": "sender-pubkey",
        "toUserAccount": "receiver-pubkey",
        "tokenAmount": 0.001,
        "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      }
    ]
  }
]
```

**処理フロー**:
1. Bearer トークン認証（タイミングセーフ比較）
2. JSON ペイロードバリデーション
3. 承認済み API のウォレット → API 情報マップ構築
4. 各 `tokenTransfer` の `toUserAccount` をマップと照合
5. 一致する場合 `payments` テーブルに `INSERT OR IGNORE`

**レスポンス** `200`:
```json
{ "success": true, "data": { "inserted": 3 } }
```

**エラーレスポンス**:
- `401`: 認証失敗
- `400`: ペイロード不正
- `503`: Webhook シークレット未設定

### 6.9 `GET /payments`

決済一覧を取得する。

**クエリパラメータ**:

| パラメータ | 型 | デフォルト | バリデーション |
|-----------|-----|----------|-------------|
| `apiId` | string | — | UUID 形式 |
| `limit` | number | 20 | 1〜100 |
| `page` | number | 1 | 1 以上 |

**レスポンス** `200`:
```json
{
  "success": true,
  "data": [{ "signature": "...", "apiId": "...", "amount": "0.001", ... }],
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
```

---

## 7. データフロー

### 7.1 API 登録フロー

```
ユーザー
  │
  ▼  POST /apis { url, name?, network? }
Worker
  │ 1. CreateApiListingInputSchema でバリデーション
  │ 2. URL 重複チェック (SELECT id FROM apis WHERE url = ?)
  │ 3. UUID 生成、status="pending" で INSERT
  │ 4. HTTP 202 レスポンス返却
  │
  ▼  waitUntil() — 非同期バックグラウンド処理
Worker (Background)
  │ 5. status → "verifying" に UPDATE
  │ 6. URL に GET リクエスト送信
  │ 7. HTTP 402 ステータス確認
  │ 8. X402ChallengeSchema でレスポンスバリデーション
  │ 9. Solana ネットワークエントリ抽出
  │
  ├─ 成功: status="approved", wallet/price/token を UPDATE
  └─ 失敗: status="rejected" に UPDATE
```

### 7.2 決済 Webhook フロー

```
Solana Network
  │  トランザクション発生
  ▼
Helius Enhanced API
  │  WebSocket / ポーリングでトランザクション検出
  ▼
Helius → POST /payments/webhook
  │  Authorization: Bearer <secret>
  │  Body: HeliusWebhookEntry[]
  ▼
Worker
  │ 1. Bearer トークン検証（タイミングセーフ）
  │ 2. ペイロードバリデーション
  │ 3. 承認済み API ウォレットマップ構築
  │    SELECT id, wallet, network FROM apis WHERE status='approved'
  │ 4. tokenTransfers.toUserAccount とウォレットを照合
  │ 5. 一致 → payments テーブルに INSERT OR IGNORE
  ▼
D1 Database
  │  payments レコード追加
  ▼
Web Frontend (次回 SSR 時にデータ反映)
```

### 7.3 データ表示フロー

```
Browser → Pages (SSR / Edge)
  │  fetch(WORKER_URL + '/apis?status=approved&network=devnet')
  │  fetch(WORKER_URL + '/apis/stats?network=devnet')
  ▼
Worker
  │  D1 SQL クエリ実行
  ▼
D1 → Worker → Pages → Browser
  │  JSON レスポンス → React SSR → HTML
```

---

## 8. セキュリティモデル

### 8.1 SSRF 防御

API 登録時の URL 検証で、サーバーサイドリクエストフォージェリを防止:

| ブロック対象 | 範囲 |
|-------------|------|
| localhost | `localhost` |
| ループバック | `127.0.0.0/8` |
| プライベート A | `10.0.0.0/8` |
| プライベート B | `172.16.0.0/12` |
| プライベート C | `192.168.0.0/16` |
| リンクローカル | `169.254.0.0/16`（AWS メタデータ含む） |
| IPv6 ループバック | `::1`, `[::1]` |

### 8.2 Webhook 認証

- Bearer トークン形式: `Authorization: Bearer <secret>`
- **タイミングセーフ比較**: XOR ベースのバイト単位比較、長さ不一致でも全バイト走査
- シークレットは `wrangler secret put` で設定（コードに含めない）

### 8.3 CORS

- `ALLOWED_ORIGIN` 環境変数で制御
- カンマ区切りで複数オリジン指定可能
- `"*"` で全オリジン許可（開発用）
- 許可メソッド: `GET`, `POST`, `OPTIONS`

### 8.4 HTTPS 強制

- API 登録 URL は HTTPS のみ受付
- HTTP プロトコルはバリデーションで拒否

### 8.5 データベース安全性

- 全クエリがパラメタライズド（SQL インジェクション防止）
- CHECK 制約で `network` と `status` の値を限定
- FOREIGN KEY + CASCADE DELETE で参照整合性保証

### 8.6 シークレット管理

- `HELIUS_API_KEY`、`HELIUS_WEBHOOK_SECRET` は `wrangler secret put` で投入
- `.dev.vars` はローカル専用、`.gitignore` で除外
- `wrangler.toml` にはシークレットを記載しない

---

## 9. テスト構成

| パッケージ | テストファイル | 対象 |
|-----------|-------------|------|
| `packages/shared` | `src/__tests__/schemas.test.ts` | 全 Zod スキーマバリデーション |
| `apps/worker` | `src/__tests__/webhook-auth.test.ts` | Bearer トークン認証 |
| `apps/worker` | `src/__tests__/verify402-url.test.ts` | SSRF 防御・URL バリデーション |
| `apps/worker` | `src/__tests__/stats.test.ts` | 統計集計・マッピング |

テストフレームワーク: **Vitest** (`environment: "node"`)
実行: `pnpm test`（Turborepo 経由で全パッケージ実行）
