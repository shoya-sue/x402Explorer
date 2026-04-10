import Link from "next/link";
import type { ApiListing } from "@x402/shared";
import StatusBadge from "./StatusBadge.js";

const CATEGORY_ACCENT: Record<string, string> = {
  DeFi: "border-l-solana-green",
  NFT: "border-l-solana-purple",
  Gaming: "border-l-yellow-400",
  Data: "border-l-sky-400",
  AI: "border-l-pink-400",
  Other: "border-l-solana-muted",
};

interface ApiCardProps {
  api: ApiListing;
}

export default function ApiCard({ api }: ApiCardProps) {
  const accentColor = CATEGORY_ACCENT[api.category ?? "Other"] ?? CATEGORY_ACCENT["Other"];

  return (
    <Link
      href={`/apis/${api.id}`}
      className={`group block rounded-xl border border-solana-border/50 bg-solana-surface/50 backdrop-blur-sm p-5
                  border-l-2 ${accentColor}
                  transition-all duration-300
                  hover:border-solana-purple/40 hover:shadow-glow-card hover:-translate-y-0.5`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <StatusBadge status={api.status} />
        <span className="rounded-md bg-solana-dark/60 border border-solana-border/40 px-2 py-0.5 text-xs text-solana-muted">
          {api.network}
        </span>
      </div>
      <h2 className="font-semibold text-neutral-100 group-hover:text-gradient transition-all duration-200">
        {api.name}
      </h2>
      <p className="mt-1 truncate text-xs text-solana-muted">{api.url}</p>
      {api.status === "approved" && (
        <p className="mt-3 flex items-center gap-1 text-xs text-solana-green/80">
          <span className="font-semibold text-solana-green">
            {api.priceAmount} {api.priceToken}
          </span>
          <span className="text-solana-border">·</span>
          <span className="font-mono text-solana-muted">
            {api.wallet.slice(0, 8)}…{api.wallet.slice(-4)}
          </span>
        </p>
      )}
    </Link>
  );
}
