export const runtime = "edge";

import { Suspense } from "react";
import Link from "next/link";
import type { ApiListing } from "@x402/shared";
import ApiCard from "../components/ApiCard.js";
import NetworkToggle from "../components/NetworkToggle.js";
import GlowCard from "../components/GlowCard.js";
import GradientText from "../components/GradientText.js";
import { getApis, getApiStats } from "../lib/api.js";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { network?: string };
}

export default async function Home({ searchParams }: PageProps) {
  const network = searchParams?.network ?? "devnet";

  let apis: ApiListing[] = [];
  let total = 0;
  let totalVolume = "0";
  const networkCount = 2;

  try {
    const [apisRes, statsData] = await Promise.all([
      getApis({ network, limit: 50 }),
      getApiStats({ network }),
    ]);
    apis = apisRes.data;
    total = apisRes.meta.total;
    totalVolume = statsData
      .reduce((sum, s) => sum + Number(s.totalVolume), 0)
      .toFixed(2);
  } catch {
    // worker not running during build — show empty state
  }

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="relative py-20 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-8 h-56 w-56 rounded-full bg-solana-purple/15 blur-3xl animate-float" />
          <div className="absolute right-1/4 top-20 h-40 w-40 rounded-full bg-solana-green/10 blur-3xl animate-float animate-delay-300" />
        </div>

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-solana-green/30 bg-solana-green/10 px-4 py-1.5 text-xs font-medium text-solana-green">
            <span className="h-1.5 w-1.5 rounded-full bg-solana-green animate-pulse" />
            Live on Solana Devnet
          </div>

          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            <GradientText>x402 Ecosystem</GradientText>
            <br />
            <span className="text-neutral-100">at a Glance</span>
          </h1>

          <p className="mt-6 mx-auto max-w-2xl text-lg text-solana-muted">
            Discover, register, and visualize APIs implementing the{" "}
            <a href="https://x402.org" target="_blank" rel="noopener noreferrer" className="text-solana-green hover:underline">
              x402 payment protocol
            </a>
            {" "}on Solana — the infrastructure index for AI agent payments.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/submit" className="glow-btn">
              Register Your API →
            </Link>
            <Link
              href="/map"
              className="rounded-lg border border-solana-border px-6 py-2.5 text-sm font-semibold text-neutral-300 transition-all duration-200 hover:border-solana-purple/50 hover:text-white hover:bg-solana-surface"
            >
              View Eco Map
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="mb-12 grid grid-cols-3 gap-4">
        <GlowCard className="text-center" hover={false}>
          <p className="text-3xl font-bold gradient-text">{total}</p>
          <p className="mt-1 text-xs text-solana-muted">APIs Indexed</p>
        </GlowCard>
        <GlowCard className="text-center" hover={false}>
          <p className="text-3xl font-bold gradient-text">{totalVolume}</p>
          <p className="mt-1 text-xs text-solana-muted">USDC Volume</p>
        </GlowCard>
        <GlowCard className="text-center" hover={false}>
          <p className="text-3xl font-bold gradient-text">{networkCount}</p>
          <p className="mt-1 text-xs text-solana-muted">Networks</p>
        </GlowCard>
      </section>

      {/* API Grid */}
      <section className="pb-20">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-neutral-200">
            {total} API{total !== 1 ? "s" : ""} · {network}
          </h2>
          <Suspense fallback={null}>
            <NetworkToggle defaultNetwork={network as "devnet" | "mainnet-beta"} />
          </Suspense>
        </div>

        {apis.length === 0 ? (
          <GlowCard className="px-6 py-16 text-center" hover={false}>
            <p className="text-solana-muted">No APIs registered yet.</p>
            <Link href="/submit" className="mt-3 inline-block text-sm text-solana-green hover:underline">
              Register the first one →
            </Link>
          </GlowCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apis.map((api, i) => (
              <div
                key={api.id}
                className="animate-fade-in opacity-0"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "forwards" }}
              >
                <ApiCard api={api} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
