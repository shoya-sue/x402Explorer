import { z } from "zod";

// Week 3-4 で詳細化予定の x402 HTTP 402 レスポンス最小形
export const X402ChallengeSchema = z.object({
  x402Version: z.number().int().optional(),
  accepts: z.array(
    z.object({
      scheme: z.string(),
      network: z.string(),
      maxAmountRequired: z.string(),
      asset: z.string(),
      payTo: z.string(),
      resource: z.string().optional(),
    }),
  ),
});
export type X402Challenge = z.infer<typeof X402ChallengeSchema>;
