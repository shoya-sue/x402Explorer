import { z } from "zod";

export const ApiStatsSchema = z.object({
  apiId: z.string().uuid(),
  totalVolume: z.string(),                      // SUM を TEXT で保持（精度維持）
  paymentCount: z.number().int().nonnegative(),
  lastPaymentAt: z.string().datetime().nullable(),
  token: z.string().nullable(),                 // 最頻出 token（mvp: 単一想定）
});
export type ApiStats = z.infer<typeof ApiStatsSchema>;
