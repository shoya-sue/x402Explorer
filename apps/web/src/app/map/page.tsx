import Link from "next/link";
import type { ApiListing } from "@x402/shared";
import EcoMap from "../../components/EcoMap.js";
import { getApis } from "../../lib/api.js";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  let apis: ApiListing[] = [];
  let total = 0;

  try {
    const res = await getApis({ status: "approved", limit: 100 });
    apis = res.data;
    total = res.meta.total;
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
        </div>
      </header>

      <EcoMap apis={apis} />
    </div>
  );
}
