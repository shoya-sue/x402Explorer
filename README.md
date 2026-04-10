# x402 Explorer

Discover, register, and visualize APIs that implement the [x402 payment protocol](https://x402.org) on Solana.

> **Colosseum Hackathon submission** — Week 5-6: Stats API + EcoMap real data + NetworkToggle

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.11.x | Use `.node-version` or `nvm use` |
| pnpm | 9.x | `npm install -g pnpm@9.12.0` |
| wrangler | latest | `pnpm add -g wrangler` |
| Helius API key | — | [helius.dev](https://helius.dev) |
| Cloudflare account | — | For `wrangler dev` (local mode) |

> If `pnpm` is gated by Corepack, run `corepack enable` first.

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env — set HELIUS_API_KEY=<your-key>

cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Edit apps/worker/.dev.vars — set HELIUS_API_KEY=<your-key>

# 3. Build all packages
pnpm build

# 4. Start dev servers (web :3000 + worker :8787)
pnpm dev
```

---

## Verification (Week 1-2 completion checklist)

Run the following in order from the repo root:

```bash
# Tool versions
node --version      # v20.x
pnpm --version      # 9.x

# Full build (shared → helius → web → worker)
pnpm build

# Type check (0 errors expected)
pnpm typecheck

# Helius connection milestone
pnpm verify:helius
# Expected: "[verify] OK — Helius API connection confirmed."

# Apply local D1 migrations
pnpm db:migrate:local

# Worker health check
pnpm dev:worker &
curl -s http://localhost:8787/health | jq
# Expected: { "ok": true, "d1": { "ok": true }, "heliusKeyConfigured": true, "network": "devnet" }
kill %1

# Web smoke test
pnpm dev:web &
curl -sI http://localhost:3000 | head -1
# Expected: HTTP/1.1 200 OK
kill %1

# Parallel dev (both servers)
pnpm dev
```

---

## Project Structure

```
x402Explorer/
├── apps/
│   ├── web/          # Next.js 14 App Router + Tailwind v3  (port 3000)
│   └── worker/       # Cloudflare Workers + Hono + D1       (port 8787)
└── packages/
    ├── shared/       # @x402/shared — Zod schemas + types
    └── helius/       # @x402/helius — Helius API client
```

## Key Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all packages (Turborepo) |
| `pnpm dev` | Start web + worker in parallel |
| `pnpm dev:web` | Start Next.js only |
| `pnpm dev:worker` | Start Wrangler dev only |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm verify:helius` | Prove Helius devnet connection |
| `pnpm db:migrate:local` | Apply D1 migrations locally |

## Environment Variables

### Root `.env` (for verify script)

```env
HELIUS_API_KEY=your_key_here
HELIUS_NETWORK=devnet
```

### `apps/worker/.dev.vars` (for wrangler)

```env
HELIUS_API_KEY=your_key_here
```

> **Note**: Both files need the same key. This is a Wrangler limitation — `.dev.vars` is the only way to inject secrets into `wrangler dev`.

---

## Week 5-6 Demo

```bash
# 1. Apply local D1 migration & start worker
pnpm db:migrate:local
pnpm dev:worker &

# 2. Seed 5 devnet APIs and start payment loop
pnpm --filter scripts exec tsx scripts/devnet-cycle.ts &
sleep 10

# 3. Test stats endpoints
curl -s http://localhost:8787/apis/stats | jq
curl -s http://localhost:8787/apis/stats?network=devnet | jq
curl -s http://localhost:8787/apis/11111111-0000-0000-0000-000000000001/stats | jq

# 4. Test mainnet-beta registration path
curl -s -X POST http://localhost:8787/apis \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","name":"test","network":"mainnet-beta"}' | jq

# 5. Start web
pnpm dev:web
# Visit http://localhost:3000        — NetworkToggle, filtered API grid
# Visit http://localhost:3000/map    — EcoMap with real volume data
# Visit http://localhost:3000/apis/<id> — Stats card (total volume, payment count)

kill %1 %2
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | pnpm workspace + Turborepo 2.x |
| Language | TypeScript 5.5+ |
| Frontend | Next.js 14 (App Router) + Tailwind v3 |
| Backend | Cloudflare Workers + Hono 4 |
| Database | Cloudflare D1 (local SQLite / prod) |
| Validation | Zod 3 |
| Package build | tsup (ESM + CJS + dts) |
| Solana RPC | Helius Enhanced API |

---

## Production Deployment

### Architecture

```
Browser → Cloudflare Pages (x402explorer.fracturelab.dev)
           ↓ fetch
         Cloudflare Workers (x402explorer-api.fracturelab.dev)
           ↓ query
         Cloudflare D1 (x402_explorer_prod)
           ↓ RPC
         Helius Enhanced API (devnet)
```

### URLs

| Service | URL |
|---------|-----|
| Web (Pages) | https://x402explorer.fracturelab.dev |
| API (Worker) | https://x402explorer-api.fracturelab.dev |
| Pages preview | https://x402-explorer-web.pages.dev |

### Manual Deploy

#### Prerequisites

- `wrangler login` で Kojin アカウントに認証済み
- Worker secrets 投入済み（初回のみ）:

```bash
cd apps/worker
npx wrangler secret put HELIUS_API_KEY
npx wrangler secret put HELIUS_WEBHOOK_SECRET
```

#### Worker

```bash
pnpm deploy:worker
# or: cd apps/worker && npx wrangler deploy
```

#### Pages

```bash
# NEXT_PUBLIC_WORKER_URL はビルド時に静的埋め込みされるため環境変数として渡す
cd apps/web
NEXT_PUBLIC_WORKER_URL=https://x402explorer-api.fracturelab.dev npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static --project-name=x402-explorer-web
```

#### D1 Migration（スキーマ変更時のみ）

```bash
pnpm db:migrate:production
```

### CI/CD (GitHub Actions)

`main` ブランチへの push で Worker → Pages の順に自動デプロイ（`.github/workflows/deploy.yml`）。

以下の GitHub Secrets を Settings → Secrets and variables → Actions で設定：

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard で作成（権限: Workers Scripts:Edit, D1:Edit, Pages:Edit, Account:Read） |
| `CLOUDFLARE_ACCOUNT_ID` | `174035f0b17da0144acfa9e8b371d46f` |
| `NEXT_PUBLIC_WORKER_URL` | `https://x402explorer-api.fracturelab.dev` |

**API Token 作成手順:**
1. Cloudflare Dashboard → My Profile → API Tokens → "Create Custom Token"
2. 権限: Account / Workers Scripts / Edit, Account / D1 / Edit, Account / Cloudflare Pages / Edit, Account / Account Settings / Read
3. Account Resources: Kojin アカウントのみ指定

### Troubleshooting

| 問題 | 原因 | 対処 |
|------|------|------|
| CORS エラー (ブラウザ) | Worker の `ALLOWED_ORIGIN` 不一致 | `apps/worker/wrangler.toml` の `[vars] ALLOWED_ORIGIN` を確認 |
| 401 on `/payments/webhook` | `HELIUS_WEBHOOK_SECRET` 未設定 or 不一致 | `cd apps/worker && npx wrangler secret put HELIUS_WEBHOOK_SECRET` で再投入 |
| Pages ビルド失敗 | `NEXT_PUBLIC_WORKER_URL` 未設定 | ビルド時に `NEXT_PUBLIC_WORKER_URL` を env として渡す |
| D1 テーブル不在 | マイグレーション未適用 | `pnpm db:migrate:production` を実行 |
| `pnpm deploy:web` が動かない | pnpm の `deploy` コマンドと競合 | `cd apps/web && npx wrangler pages deploy ...` で直接実行 |

### Security Notes

- **Webhook 認証**: `Authorization: Bearer <secret>` ヘッダ + timing-safe XOR 比較
- **CORS**: `ALLOWED_ORIGIN` env 変数で制限（本番: `https://x402explorer.fracturelab.dev`）
- **SSRF 対策**: `verify402()` は HTTPS のみ + プライベート IP denylist + 10秒タイムアウト + 64KB body 上限
- **Secrets**: `wrangler secret put` で投入（`wrangler.toml` には記載しない）
