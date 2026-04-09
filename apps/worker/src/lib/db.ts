import type { ApiListing, Payment } from "@x402/shared";

export interface ApiRow {
  id: string;
  url: string;
  name: string;
  description: string | null;
  category: string | null;
  wallet: string;
  price_amount: string;
  price_token: string;
  network: "devnet" | "mainnet-beta";
  status: "pending" | "verifying" | "approved" | "rejected" | "disabled";
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  signature: string;
  api_id: string;
  amount: string;
  token: string;
  network: "devnet" | "mainnet-beta";
  block_time: number;
  slot: number;
  from_address: string;
  to_address: string;
  created_at: string;
}

export function rowToApiListing(row: ApiRow): ApiListing {
  return {
    id: row.id,
    url: row.url,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    wallet: row.wallet,
    priceAmount: row.price_amount,
    priceToken: row.price_token,
    network: row.network,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToPayment(row: PaymentRow): Payment {
  return {
    signature: row.signature,
    apiId: row.api_id,
    amount: row.amount,
    token: row.token,
    network: row.network,
    blockTime: row.block_time,
    slot: row.slot,
    fromAddress: row.from_address,
    toAddress: row.to_address,
    createdAt: row.created_at,
  };
}
