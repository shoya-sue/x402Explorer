# x402 Explorer 環境構築・運用ガイド

> 本書はローカル開発環境のセットアップから本番デプロイまでの全手順を記載する。

---

## 1. 前提条件

### 1.1 必須ツール

| ツール | バージョン | 確認コマンド | インストール |
|--------|-----------|-------------|-------------|
| Node.js | 20.11.1 | `node --version` | `.node-version` で `nvm use` |
| pnpm | 9.12.0 | `pnpm --version` | `npm install -g pnpm@9.12.0` |
| wrangler | ^3.78.0 | `wrangler --version` | `pnpm add -g wrangler` |

> Corepack が有効な場合は `corepack enable` を先に実行する。

### 1.2 外部アカウント

| サービス | 用途 | 取得先 |
|---------|------|--------|
| Helius | Solana RPC + Enhanced Transaction API | https://dashboard.helius.dev |
| Cloudflare | Workers + Pages + D1 ホスティング | https://dash.cloudflare.com |

### 1.3 バージョン固定

- `package.json` の `"engines"` フィールド: `"node": ">=20.11.0"`
- `package.json` の `"packageManager"` フィールド: `"pnpm@9.12.0"`
- `.node-version`: `20.11.1`

---

## 2. ローカル開発環境の構築

### 2.1 リポジトリクローン・依存関係インストール

```bash
git clone https://github.com/shoya-sue/x402Explorer.git
cd x402Explorer
pnpm install
```

### 2.2 環境変数の設定

3 つの環境変数ファイルを設定する:

#### ① ルート `.env`

```bash
cp .env.example .env
```

```env
HELIUS_API_KEY=<your-helius-api-key>
HELIUS_NETWORK=devnet
```

#### ② Worker 開発用 `apps/worker/.dev.vars`

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
```

```env
HELIUS_API_KEY=<your-helius-api-key>
HELIUS_WEBHOOK_SECRET=dev-webhook-secret-change-me
ALLOWED_ORIGIN=http://localhost:3000
```

> **注意**: `.env` と `.dev.vars` の両方に同じ `HELIUS_API_KEY` を設定する必要がある。
> Wrangler は `.dev.vars` のみを読み取り、ルートの `.env` は `verify:helius` スクリプト用。

#### ③ Web 開発用 `apps/web/.env`（任意）

```bash
cp apps/web/.env.example apps/web/.env.local
```

```env
NEXT_PUBLIC_WORKER_URL=http://localhost:8787
```

> デフォルト値がコード内で `http://localhost:8787` に設定されているため、ローカル開発では省略可能。

### 2.3 ビルド

```bash
pnpm build
```

Turborepo が以下の順序でビルドを実行:
1. `packages/shared` → `dist/`
2. `packages/helius` → `dist/`
3. `apps/worker` → `dist/`
4. `apps/web` → `.next/`

### 2.4 型チェック

```bash
pnpm typecheck
```

全パッケージで TypeScript の型チェックを実行（0 エラーが期待値）。

### 2.5 Helius 接続確認

```bash
pnpm verify:helius
```

期待出力: `[verify] OK — Helius API connection confirmed.`

### 2.6 データベースマイグレーション（ローカル）

```bash
pnpm db:migrate:local
```

ローカルの SQLite ファイル（`.wrangler/state/`）に `apis` と `payments` テーブルを作成する。

### 2.7 開発サーバー起動

```bash
# Worker + Web を同時起動
pnpm dev

# 個別起動
pnpm dev:worker   # Worker のみ (port 8787)
pnpm dev:web      # Web のみ (port 3000)
```

### 2.8 動作確認

```bash
# Worker ヘルスチェック
curl -s http://localhost:8787/health | jq

# Web アクセス確認
curl -sI http://localhost:3000 | head -1
# → HTTP/1.1 200 OK
```

---

## 3. 環境変数リファレンス

### 3.1 全環境変数一覧

| 変数名 | 設定場所 | 用途 | 必須 |
|--------|---------|------|------|
| `HELIUS_API_KEY` | `.env`, `.dev.vars`, Workers Secret | Helius API 認証キー | ✅ |
| `HELIUS_NETWORK` | `.env`, `wrangler.toml [vars]` | Solana ネットワーク (`devnet` \| `mainnet-beta`) | ✅ |
| `HELIUS_WEBHOOK_SECRET` | `.dev.vars`, Workers Secret | Webhook Bearer トークン | ✅ |
| `ALLOWED_ORIGIN` | `.dev.vars`, `wrangler.toml [vars]` | CORS 許可オリジン | ✅ |
| `NEXT_PUBLIC_WORKER_URL` | `apps/web/.env`, GitHub Secret | Worker API ベース URL | ✅ (本番) |
| `NODE_ENV` | 自動設定 | 実行環境 | — |
| `CLOUDFLARE_API_TOKEN` | GitHub Secret | Cloudflare API 認証 | ✅ (デプロイ) |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Secret | Cloudflare アカウント ID | ✅ (デプロイ) |

### 3.2 設定場所の詳細マッピング

```
ローカル開発
├── .env (ルート)
│   ├── HELIUS_API_KEY        → verify:helius スクリプト用
│   └── HELIUS_NETWORK        → verify:helius スクリプト用
│
├── apps/worker/.dev.vars
│   ├── HELIUS_API_KEY        → wrangler dev 時の Worker ランタイム
│   ├── HELIUS_WEBHOOK_SECRET → wrangler dev 時の Worker ランタイム
│   └── ALLOWED_ORIGIN        → wrangler dev 時の CORS 設定
│
└── apps/web/.env.local (任意)
    └── NEXT_PUBLIC_WORKER_URL → Next.js ビルド時に埋め込み

本番 (Cloudflare)
├── wrangler.toml [vars]
│   ├── HELIUS_NETWORK = "devnet"
│   └── ALLOWED_ORIGIN = "https://x402explorer.fracturelab.dev"
│
├── Cloudflare Workers Secrets (wrangler secret put)
│   ├── HELIUS_API_KEY
│   └── HELIUS_WEBHOOK_SECRET
│
└── GitHub Actions Secrets
    ├── CLOUDFLARE_API_TOKEN
    ├── CLOUDFLARE_ACCOUNT_ID
    └── NEXT_PUBLIC_WORKER_URL

Turborepo キャッシュ監視 (turbo.json globalEnv)
├── NODE_ENV
├── HELIUS_API_KEY
├── HELIUS_NETWORK
├── HELIUS_WEBHOOK_SECRET
├── ALLOWED_ORIGIN
└── NEXT_PUBLIC_WORKER_URL
```

### 3.3 Cloudflare Workers Secrets 投入手順

初回デプロイ時、または値変更時に実行:

```bash
cd apps/worker

# Helius API キー
wrangler secret put HELIUS_API_KEY
# プロンプトに API キーを入力

# Webhook シークレット
wrangler secret put HELIUS_WEBHOOK_SECRET
# プロンプトにシークレットを入力
```

---

## 4. スクリプトリファレンス

### 4.1 ルートスクリプト (`package.json`)

| スクリプト | コマンド | 説明 |
|-----------|---------|------|
| `build` | `turbo run build` | 全パッケージを依存順にビルド |
| `dev` | `turbo run dev` | Web + Worker を並列起動 |
| `dev:web` | `pnpm --filter web dev` | Next.js 開発サーバー (port 3000) |
| `dev:worker` | `pnpm --filter worker dev` | Wrangler 開発サーバー (port 8787) |
| `lint` | `turbo run lint` | 全パッケージの Lint 実行 |
| `typecheck` | `turbo run typecheck` | 全パッケージの TypeScript 型チェック |
| `test` | `turbo run test` | 全パッケージのテスト実行 |
| `clean` | `turbo run clean && rm -rf node_modules .turbo` | ビルド成果物・依存関係を削除 |
| `verify:helius` | `pnpm --filter @x402/helius verify` | Helius API 接続テスト |
| `db:migrate:local` | `pnpm --filter worker db:migrate:local` | ローカル D1 マイグレーション適用 |
| `db:migrate:list` | `pnpm --filter worker db:migrate:list` | ローカル D1 マイグレーション一覧 |
| `db:migrate:production` | `pnpm --filter worker db:migrate:production` | 本番 D1 マイグレーション適用 |
| `devnet-cycle` | `tsx scripts/devnet-cycle.ts` | デモ用決済ループスクリプト |
| `deploy:worker` | `pnpm --filter worker deploy` | Worker を本番デプロイ |
| `deploy:web` | `pnpm --filter web pages:build && pnpm --filter web deploy` | Web を Pages ビルド→デプロイ |
| `deploy` | `pnpm run deploy:worker && pnpm run deploy:web` | Worker → Web の順に全デプロイ |

### 4.2 Worker スクリプト (`apps/worker/package.json`)

| スクリプト | コマンド | 説明 |
|-----------|---------|------|
| `dev` | `wrangler dev` | ローカル開発サーバー起動 |
| `build` | `wrangler deploy --dry-run --outdir=dist` | ドライランビルド（デプロイなし） |
| `typecheck` | `tsc --noEmit` | TypeScript 型チェック |
| `lint` | `echo 'no lint configured'` | (未設定) |
| `test` | `vitest run` | Vitest テスト実行 |
| `deploy` | `wrangler deploy` | Cloudflare Workers にデプロイ |
| `db:migrate:local` | `wrangler d1 migrations apply x402_explorer --local` | ローカル D1 マイグレーション |
| `db:migrate:list` | `wrangler d1 migrations list x402_explorer --local` | ローカルマイグレーション一覧 |
| `db:migrate:production` | `wrangler d1 migrations apply x402_explorer_prod --remote` | 本番 D1 マイグレーション |
| `clean` | `rm -rf dist .wrangler .turbo *.tsbuildinfo` | ビルド成果物削除 |

### 4.3 Web スクリプト (`apps/web/package.json`)

| スクリプト | コマンド | 説明 |
|-----------|---------|------|
| `dev` | `next dev -p 3000` | Next.js 開発サーバー |
| `build` | `NODE_ENV=production next build` | プロダクションビルド |
| `start` | `next start` | プロダクションサーバー起動 |
| `lint` | `next lint` | ESLint 実行 |
| `typecheck` | `tsc --noEmit` | TypeScript 型チェック |
| `test` | `echo 'no tests configured'` | (未設定) |
| `pages:build` | `npx @cloudflare/next-on-pages` | Cloudflare Pages 用ビルド |
| `preview` | `wrangler pages dev .vercel/output/static` | Pages ローカルプレビュー |
| `deploy` | `wrangler pages deploy .vercel/output/static --project-name=x402-explorer-web` | Pages デプロイ |
| `clean` | `rm -rf .next .vercel .turbo *.tsbuildinfo` | ビルド成果物削除 |

### 4.4 Turborepo パイプライン (`turbo.json`)

| タスク | `dependsOn` | `outputs` | `cache` | `persistent` |
|--------|------------|-----------|---------|-------------|
| `build` | `["^build"]` | `["dist/**", ".next/**", "!.next/cache/**"]` | ✅ | — |
| `dev` | `["^build"]` | — | ❌ | ✅ |
| `lint` | `["^build"]` | — | ✅ | — |
| `typecheck` | `["^build"]` | `[]` | ✅ | — |
| `test` | `["^build"]` | `[]` | ✅ | — |
| `clean` | — | — | ❌ | — |

**`globalDependencies`** (変更でキャッシュ無効化):
- `.env`, `.env.example`, `tsconfig.base.json`

**`globalEnv`** (変更でキャッシュ無効化):
- `NODE_ENV`, `HELIUS_API_KEY`, `HELIUS_NETWORK`, `HELIUS_WEBHOOK_SECRET`, `ALLOWED_ORIGIN`, `NEXT_PUBLIC_WORKER_URL`

---

## 5. データベースマイグレーション

### 5.1 マイグレーションファイル

| ファイル | 内容 |
|---------|------|
| `apps/worker/migrations/0001_init.sql` | 初期スキーマ（`apis` + `payments` テーブル） |

### 5.2 ローカル環境

```bash
# マイグレーション適用
pnpm db:migrate:local

# 適用済みマイグレーション確認
pnpm db:migrate:list
```

ローカル D1 データは `apps/worker/.wrangler/state/` に SQLite ファイルとして保存される。

### 5.3 本番環境

```bash
# 本番 D1 にマイグレーション適用
pnpm db:migrate:production
```

> **注意**: 本番 D1 への操作は `wrangler login` で Cloudflare アカウントに認証済みであることが前提。

### 5.4 新規マイグレーション作成

```bash
# apps/worker/migrations/ に新しいマイグレーションファイルを作成
# ファイル名規則: {連番}_{説明}.sql
# 例: 0002_add_category_index.sql
```

---

## 6. 本番デプロイ

### 6.1 アーキテクチャ

```
GitHub (main push)
  │
  ├─ CI (ci.yml)
  │   └─ install → build → typecheck → lint → test
  │
  └─ Deploy (deploy.yml)
      ├─ Job 1: deploy-worker
      │   └─ build shared → build helius → wrangler deploy
      └─ Job 2: deploy-web (depends on deploy-worker)
          └─ build shared → pages:build → wrangler pages deploy
```

### 6.2 GitHub Actions Secrets 設定

リポジトリの Settings → Secrets and variables → Actions に以下を設定:

| Secret 名 | 値 | 用途 |
|-----------|-----|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン | wrangler deploy 認証 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID | デプロイ先アカウント |
| `NEXT_PUBLIC_WORKER_URL` | `https://x402explorer-api.fracturelab.dev` | Web ビルド時の API URL |

### 6.3 CI パイプライン (`ci.yml`)

**トリガー**: `main` への push または pull request

```
ubuntu-latest + Node.js 20.11 + pnpm 9.12.0
  1. pnpm install --frozen-lockfile
  2. pnpm build
  3. pnpm typecheck
  4. pnpm lint
  5. pnpm test
```

### 6.4 デプロイパイプライン (`deploy.yml`)

**トリガー**: `main` への push または手動 (workflow_dispatch)

**Job 1: `deploy-worker`**
```
1. pnpm install --frozen-lockfile
2. pnpm --filter @x402/shared build
3. pnpm --filter @x402/helius build
4. wrangler deploy (cloudflare/wrangler-action@v3)
   - apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
   - accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
   - workingDirectory: apps/worker
```

**Job 2: `deploy-web`** (deploy-worker 完了後)
```
1. pnpm install --frozen-lockfile
2. pnpm --filter @x402/shared build
3. NEXT_PUBLIC_WORKER_URL=${{ secrets.NEXT_PUBLIC_WORKER_URL }}
   pnpm --filter web pages:build
4. wrangler pages deploy .vercel/output/static
   --project-name=x402-explorer-web --branch=main
```

### 6.5 手動デプロイ

```bash
# 1. Cloudflare にログイン
wrangler login

# 2. Worker デプロイ
pnpm deploy:worker

# 3. Web デプロイ（NEXT_PUBLIC_WORKER_URL を指定）
NEXT_PUBLIC_WORKER_URL=https://x402explorer-api.fracturelab.dev pnpm deploy:web

# 4. または一括デプロイ
pnpm deploy
```

### 6.6 本番 D1 マイグレーション

新しいマイグレーションファイルを追加した場合:

```bash
# 本番 D1 に適用
pnpm db:migrate:production
```

### 6.7 Cloudflare Workers Secrets（初回設定）

```bash
cd apps/worker

wrangler secret put HELIUS_API_KEY
# → プロンプトに API キーを貼り付け

wrangler secret put HELIUS_WEBHOOK_SECRET
# → プロンプトにシークレットを貼り付け
```

---

## 7. devnet-cycle デモスクリプト

### 7.1 概要

`scripts/devnet-cycle.ts` は、デモ / 開発用の決済シミュレーションスクリプト。
ローカル Worker に対して定期的に偽の Helius Webhook ペイロードを送信し、決済データを生成する。

### 7.2 前提条件

- Worker が起動済み (`pnpm dev:worker`)
- ローカル D1 マイグレーション適用済み (`pnpm db:migrate:local`)

### 7.3 実行方法

```bash
# ターミナル 1: Worker 起動
pnpm dev:worker

# ターミナル 2: デモスクリプト実行
pnpm devnet-cycle
# Ctrl+C で停止
```

### 7.4 動作内容

1. **シードフェーズ**: 5 つのデモ API を D1 に挿入（`INSERT OR IGNORE`）

   | 名前 | 価格 |
   |------|------|
   | AI Text Generator | 0.001 USDC |
   | Image Captioning API | 0.002 USDC |
   | Code Review Service | 0.005 USDC |
   | Data Analytics API | 0.003 USDC |
   | Translation Service | 0.001 USDC |

2. **Webhook ループ**: 3 秒間隔（`CYCLE_INTERVAL_MS`）で以下を繰り返す
   - ランダムなデモ API を選択
   - ランダムな送信者ウォレットを選択
   - 偽の Enhanced Transaction を生成（金額は ±20% のランダム変動）
   - `POST /payments/webhook` に送信

### 7.5 設定項目

| 環境変数 | デフォルト | 説明 |
|---------|----------|------|
| `WORKER_URL` | `http://localhost:8787` | Worker の URL |
| `CYCLE_INTERVAL_MS` | `3000` | ループ間隔（ミリ秒） |

---

## 8. コード品質設定

### 8.1 EditorConfig (`.editorconfig`)

```ini
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### 8.2 Prettier (`.prettierrc.json`)

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": []
}
```

**除外対象** (`.prettierignore`):
- `node_modules/`, `dist/`, `.next/`, `.wrangler/`, `pnpm-lock.yaml`

### 8.3 TypeScript (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "lib": ["ES2022"]
  }
}
```

**パスエイリアス**:
- `@x402/shared` → `packages/shared/src/index.ts`
- `@x402/helius` → `packages/helius/src/index.ts`

### 8.4 Git 管理除外 (`.gitignore` 主要ルール)

```
node_modules/          # 依存関係
dist/                  # ビルド出力
.next/                 # Next.js キャッシュ
.vercel/               # Vercel 出力
.turbo/                # Turborepo キャッシュ
.wrangler/             # Wrangler ローカル状態
.env                   # 環境変数ファイル
.env.local
.env.*.local
apps/worker/.dev.vars  # Worker シークレット
*.tsbuildinfo          # TypeScript インクリメンタルビルド
```

---

## 9. Cloudflare リソース設定

### 9.1 Worker (`apps/worker/wrangler.toml`)

| 設定項目 | 値 |
|---------|-----|
| name | `x402-explorer-worker` |
| main | `src/index.ts` |
| compatibility_date | `2024-09-23` |
| compatibility_flags | `["nodejs_compat"]` |
| account_id | `174035f0b17da0144acfa9e8b371d46f` |

**D1 バインディング**:

| 項目 | 値 |
|------|-----|
| binding | `DB` |
| database_name | `x402_explorer_prod` |
| database_id | `c6d1ee3c-75a3-4354-b745-30609fbd816e` |
| migrations_dir | `migrations` |

**カスタムドメイン**:
- `x402explorer-api.fracturelab.dev`

### 9.2 Pages (`apps/web/wrangler.toml`)

| 設定項目 | 値 |
|---------|-----|
| name | `x402-explorer-web` |
| compatibility_date | `2024-09-23` |
| compatibility_flags | `["nodejs_compat"]` |
| pages_build_output_dir | `.vercel/output/static` |

**ビルドフロー**:
```
next build → .vercel/output/
@cloudflare/next-on-pages → .vercel/output/static/
wrangler pages deploy → Cloudflare Pages
```
