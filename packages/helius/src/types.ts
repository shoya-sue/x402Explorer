export interface HeliusRpcResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result: T;
  error?: { code: number; message: string };
}

// Helius Enhanced Transaction API レスポンスの部分型 — Week 3-4 で拡張予定
export interface HeliusEnhancedTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  description?: string;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
  }>;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
}
