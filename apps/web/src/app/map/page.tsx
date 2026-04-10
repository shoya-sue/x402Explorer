export const runtime = "edge";

import { Suspense } from "react";
import Link from "next/link";
import type { ApiListing, ApiStats } from "@x402/shared";
import EcoMap from "../../components/EcoMap.js";
import NetworkToggle from "../../components/NetworkToggle.js";
import GlowCard from "../../components/GlowCard.js";
import GradientText from "../../components/GradientText.js";
import { getApis, getApiStats } from "../../lib/api.js";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { network?: string };
}

export default async function MapPage({ searchParams }: PageProps) {
  const network = searchParams?.network ?? "devnet";

  let apis: ApiListing[] = [];
  let total = 0;
  let totalVolume = "0";
  let totalPayments = 0;
  let statsMap: Record<string, ApiStats> = {};

  try {
    const [apisRes, statsData] = await Promise.all([
      getApis({ status: "approved", network, limit: 100 }),
      getApiStats({ network }),
    ]);
    apis = apisRes.data;
    total = apisRes.meta.total;
    statsMap = Object.fromEntries(statsData.map((s) => [s.apiId, s]));
    totalVolume = statsData
      .reduce((sum, s) => sum + Number(s.totalVolume), 0)
      .toFixed(2);
    totalPayments = statsData.reduce((sum, s) => sum + s.paymentCount, 0);
  } catch {
    // worker not running during build — show empty state
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="relative mb-10">
        <div className="pointer-events-none absolute -top-6 right-0 h-48 w-48 rounded-full bg-solana-green/8 blur-3xl" />
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-solana-muted hover:text-neutral-200 transition-colors duration-200"
        >
          ← Back to explorer
        </Link>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <GradientText>Eco Map</GradientText>
            </h1>
            <p className="mt-2 text-sm text-solana-muted">
              Payment volume visualization across the x402 ecosystem
            </p>
          </div>
          <Suspense fallback={null}>
            <NetworkToggle defaultNetwork={network as "devnet" | "mainnet-beta"} />
          </Suspense>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <GlowCard className="text-center py-4" hover={false}>
          <p className="text-2xl font-bold gradient-text">{total}</p>
          <p className="mt-1 text-xs text-solana-muted">Approved APIs</p>
        </GlowCard>
        <GlowCard className="text-center py-4" hover={false}>
          <p className="text-2xl font-bold gradient-text">{totalVolume}</p>
          <p className="mt-1 text-xs text-solana-muted">Total Volume (USDC)</p>
        </GlowCard>
        <GlowCard className="text-center py-4" hover={false}>
          <p className="text-2xl font-bold gradient-text">{totalPayments}</p>
          <p className="mt-1 text-xs text-solana-muted">Total Payments</p>
        </GlowCard>
      </div>

      <EcoMap apis={apis} stats={statsMap} />
    </div>
  );
}
