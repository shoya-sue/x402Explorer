import { z } from "zod";
import { NetworkSchema } from "./network.js";

export const PaymentSchema = z.object({
  signature: z.string(),        // Solana tx signature (primary key)
  apiId: z.string().uuid(),
  amount: z.string(),           // 精度保持のため文字列
  token: z.string(),            // 'USDC' | mint address
  network: NetworkSchema,
  blockTime: z.number().int(),  // Unix seconds (Solana native)
  slot: z.number().int(),
  fromAddress: z.string(),
  toAddress: z.string(),
  createdAt: z.string().datetime(),
});
export type Payment = z.infer<typeof PaymentSchema>;
