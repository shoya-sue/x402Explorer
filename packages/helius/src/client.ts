import type { Network } from "@x402/shared";
import { enhancedTxUrl, rpcUrl } from "./endpoints.js";
import type { HeliusEnhancedTransaction, HeliusRpcResponse } from "./types.js";

export interface HeliusClientOptions {
  apiKey: string;
  network: Network;
  /** Workers / Node 両対応のため fetch 実装を注入可能 */
  fetchImpl?: typeof fetch;
}

export class HeliusClient {
  private readonly apiKey: string;
  private readonly network: Network;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: HeliusClientOptions) {
    if (!opts.apiKey) throw new Error("HeliusClient: apiKey is required");
    this.apiKey = opts.apiKey;
    this.network = opts.network;
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  }

  /** アドレスの Enhanced Transaction 一覧を取得する */
  async getTransactionsForAddress(
    address: string,
    opts: { limit?: number; before?: string } = {},
  ): Promise<HeliusEnhancedTransaction[]> {
    const url = new URL(enhancedTxUrl(this.network, address, this.apiKey));
    if (opts.limit !== undefined) url.searchParams.set("limit", String(opts.limit));
    if (opts.before !== undefined) url.searchParams.set("before", opts.before);

    const res = await this.fetchImpl(url.toString());
    if (!res.ok) {
      throw new Error(`Helius enhanced-tx failed: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as HeliusEnhancedTransaction[];
  }

  /** JSON-RPC getSlot — 接続疎通確認用 */
  async getSlot(): Promise<number> {
    const res = await this.fetchImpl(rpcUrl(this.network, this.apiKey), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot" }),
    });
    if (!res.ok) throw new Error(`Helius RPC failed: ${res.status}`);
    const data = (await res.json()) as HeliusRpcResponse<number>;
    if (data.error) throw new Error(`Helius RPC error: ${data.error.message}`);
    return data.result;
  }
}
