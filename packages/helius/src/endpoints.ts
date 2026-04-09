import type { Network } from "@x402/shared";

export function rpcUrl(network: Network, apiKey: string): string {
  const host = network === "devnet" ? "devnet.helius-rpc.com" : "mainnet.helius-rpc.com";
  return `https://${host}/?api-key=${apiKey}`;
}

export function enhancedTxUrl(network: Network, address: string, apiKey: string): string {
  const subdomain = network === "devnet" ? "api-devnet" : "api";
  return `https://${subdomain}.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}`;
}
