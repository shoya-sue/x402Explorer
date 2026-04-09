import { z } from "zod";

export const NetworkSchema = z.enum(["devnet", "mainnet-beta"]);
export type Network = z.infer<typeof NetworkSchema>;
