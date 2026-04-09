import { Suspense } from "react";
import Link from "next/link";
import type { ApiListing, ApiStats } from "@x402/shared";
import EcoMap from "../../components/EcoMap.js";
import NetworkToggle from "../../components/NetworkToggle.js";
import { getApis, getApiStats } from "../../lib/api.js";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { network?: string };
}

export default async function MapPage({ searchParams }: PageProps) {
  const network = searchParams?.network ?? "devnet";

  let apis: ApiListing[] = [];
  let total = 0;
  let statsMap: Record<string, ApiStats> = {};

  try {
    const [apisRes, statsData] = await Promise.all([
      getApis({ status: "approved", network, limit: 100 }),
      getApiStats({ network }),
    ]);
    apis = apisRes.data;
    total = apisRes.meta.total;
    statsMap = Object.fromEntries(statsData.map((s) => [s.apiId, s]));
  } catch {
    // worker not running during build — show empty state
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← Back to explorer
        </Link>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Eco Map</h1>
            <p className="mt-1 text-sm text-neutral-400">
              {total} approved API{total !== 1 ? "s" : ""} · Payment volume visualization
            </p>
          </div>
          <Suspense fallback={null}>
            <NetworkToggle defaultNetwork={network as "devnet" | "mainnet-beta"} />
          </Suspense>
        </div>
      </header>

      <EcoMap apis={apis} stats={statsMap} />
    </div>
  );
}
