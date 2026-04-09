import Link from "next/link";
import type { ApiListing } from "@x402/shared";
import ApiCard from "../components/ApiCard.js";
import { getApis } from "../lib/api.js";

export const dynamic = "force-dynamic";

export default async function Home() {
  let apis: ApiListing[] = [];
  let total = 0;

  try {
    const res = await getApis({ limit: 50 });
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
            {total} registered API{total !== 1 ? "s" : ""} · Solana payment protocol
          </p>
        </div>
        <Link
          href="/submit"
          className="shrink-0 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-white"
        >
          Register API
        </Link>
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
