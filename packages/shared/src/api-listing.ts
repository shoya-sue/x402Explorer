import { z } from "zod";
import { NetworkSchema } from "./network.js";

export const ApiStatusSchema = z.enum([
  "pending",    // 申請直後
  "verifying",  // 402 チェック中
  "approved",   // 掲載済み
  "rejected",   // 検証失敗
  "disabled",   // 手動無効化
]);
export type ApiStatus = z.infer<typeof ApiStatusSchema>;

export const ApiListingSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  category: z.string().max(60).optional(),
  wallet: z.string().min(32).max(48),       // Solana base58 pubkey
  priceAmount: z.string(),                   // 精度保持のため文字列
  priceToken: z.string(),                    // 'USDC' | mint address
  network: NetworkSchema,
  status: ApiStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ApiListing = z.infer<typeof ApiListingSchema>;

export const CreateApiListingInputSchema = ApiListingSchema.pick({
  url: true,
}).extend({
  name: z.string().min(1).max(120).optional(),
  network: NetworkSchema.default("devnet"),
});
export type CreateApiListingInput = z.infer<typeof CreateApiListingInputSchema>;
