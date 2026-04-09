import Link from "next/link";
import type { ApiListing } from "@x402/shared";
import StatusBadge from "./StatusBadge.js";

interface ApiCardProps {
  api: ApiListing;
}

export default function ApiCard({ api }: ApiCardProps) {
  return (
    <Link
      href={`/apis/${api.id}`}
      className="group block rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-700 hover:bg-neutral-800/60"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <StatusBadge status={api.status} />
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-500">
          {api.network}
        </span>
      </div>
      <h2 className="font-semibold text-neutral-100 group-hover:text-white">{api.name}</h2>
      <p className="mt-1 truncate text-xs text-neutral-500">{api.url}</p>
      {api.status === "approved" && (
        <p className="mt-3 text-xs text-neutral-400">
          {api.priceAmount} {api.priceToken}
          <span className="mx-1.5 text-neutral-700">·</span>
          {api.wallet.slice(0, 8)}…{api.wallet.slice(-4)}
        </p>
      )}
    </Link>
  );
}
