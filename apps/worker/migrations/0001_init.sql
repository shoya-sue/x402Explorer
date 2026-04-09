-- x402 Explorer 初期スキーマ
-- Week 1-2 基盤構築。Week 3-4 で読み書きロジックを追加予定。

CREATE TABLE IF NOT EXISTS apis (
  id           TEXT PRIMARY KEY,
  url          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  wallet       TEXT NOT NULL,
  price_amount TEXT NOT NULL,       -- 精度保持のため TEXT
  price_token  TEXT NOT NULL,       -- 'USDC' | mint address
  network      TEXT NOT NULL CHECK (network IN ('devnet', 'mainnet-beta')),
  status       TEXT NOT NULL CHECK (status IN ('pending', 'verifying', 'approved', 'rejected', 'disabled')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_apis_status_network ON apis (status, network);
CREATE INDEX IF NOT EXISTS idx_apis_wallet_network ON apis (wallet, network);

CREATE TABLE IF NOT EXISTS payments (
  signature    TEXT PRIMARY KEY,
  api_id       TEXT NOT NULL,
  amount       TEXT NOT NULL,
  token        TEXT NOT NULL,
  network      TEXT NOT NULL CHECK (network IN ('devnet', 'mainnet-beta')),
  block_time   INTEGER NOT NULL,    -- Unix seconds
  slot         INTEGER NOT NULL,
  from_address TEXT NOT NULL,
  to_address   TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (api_id) REFERENCES apis (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_api_blocktime ON payments (api_id, block_time DESC);
CREATE INDEX IF NOT EXISTS idx_payments_network_blocktime ON payments (network, block_time DESC);
