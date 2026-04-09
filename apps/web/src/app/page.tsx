export const runtime = "edge";

import { Suspense } from "react";
import Link from "next/link";
import type { ApiListing } from "@x402/shared";
import ApiCard from "../components/ApiCard.js";
import NetworkToggle from "../components/NetworkToggle.js";
import { getApis } from "../lib/api.js";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { network?: string };
}

export default async function Home({ searchParams }: PageProps) {
  const network = searchParams?.network ?? "devnet";

  let apis: ApiListing[] = [];
  let total = 0;

  try {
    const res = await getApis({ network, limit: 50 });
    apis = res.data;
    total = res.meta.total;
  } catch {
    // worker not running during build — show empty state
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">x402 Explorer</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {total} API{total !== 1 ? "s" : ""} · Discover x402-enabled APIs for AI agents
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Suspense fallback={null}>
            <NetworkToggle defaultNetwork={network as "devnet" | "mainnet-beta"} />
          </Suspense>
          <Link
            href="/submit"
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-white"
          >
            Register API
          </Link>
        </div>
      </header>

      {apis.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-6 py-16 text-center">
          <p className="text-neutral-400">No APIs registered yet.</p>
          <Link href="/submit" className="mt-3 inline-block text-sm text-blue-400 underline">
            Register the first one →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apis.map((api) => (
            <ApiCard key={api.id} api={api} />
          ))}
        </div>
      )}
    </div>
  );
}
