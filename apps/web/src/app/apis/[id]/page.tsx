export const runtime = "edge";

import Link from "next/link";
import { getApi, getApiStat, getPayments } from "../../../lib/api.js";
import StatusBadge from "../../../components/StatusBadge.js";
import PaymentTable from "../../../components/PaymentTable.js";
import GlowCard from "../../../components/GlowCard.js";
import GradientText from "../../../components/GradientText.js";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function ApiDetailPage({ params }: PageProps) {
  try {
    const [apiRes, paymentsRes, stats] = await Promise.all([
      getApi(params.id),
      getPayments({ apiId: params.id, limit: 50 }),
      getApiStat(params.id),
    ]);
    const api = apiRes.data;
    const payments = paymentsRes.data;

    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="pointer-events-none absolute right-8 top-32 h-48 w-48 rounded-full bg-solana-purple/10 blur-3xl" />

        <Link
          href="/"
          className="text-sm text-solana-muted hover:text-neutral-200 transition-colors duration-200"
        >
          ← Back to explorer
        </Link>

        <div className="mt-6 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-neutral-100">{api.name}</h1>
          <StatusBadge status={api.status} />
        </div>

        <a
          href={api.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block truncate text-sm text-solana-teal hover:text-solana-green transition-colors duration-200 hover:underline"
        >
          {api.url}
        </a>

        {api.status === "approved" && (
          <GlowCard className="mt-6 grid grid-cols-3 gap-4" hover={false}>
            <div>
              <p className="text-xs text-solana-muted">Price</p>
              <p className="mt-1 font-semibold text-solana-green">
                {api.priceAmount} {api.priceToken}
              </p>
            </div>
            <div>
              <p className="text-xs text-solana-muted">Network</p>
              <p className="mt-1 font-medium capitalize">{api.network}</p>
            </div>
            <div>
              <p className="text-xs text-solana-muted">Wallet</p>
              <p className="mt-1 font-mono text-xs text-neutral-300">
                {api.wallet.slice(0, 8)}…{api.wallet.slice(-6)}
              </p>
            </div>
          </GlowCard>
        )}

        {stats && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <GlowCard className="text-center py-4">
              <GradientText as="p" className="text-2xl font-bold">
                {stats.totalVolume}
              </GradientText>
              <p className="mt-1 text-xs text-solana-muted">{stats.token ?? api.priceToken} Volume</p>
            </GlowCard>
            <GlowCard className="text-center py-4">
              <p className="text-2xl font-bold text-solana-purple">{stats.paymentCount}</p>
              <p className="mt-1 text-xs text-solana-muted">Payments</p>
            </GlowCard>
            <GlowCard className="text-center py-4">
              <p className="text-sm font-semibold text-neutral-200">
                {stats.lastPaymentAt
                  ? new Date(stats.lastPaymentAt).toLocaleDateString("ja-JP")
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-solana-muted">Last Payment</p>
            </GlowCard>
          </div>
        )}

        {api.status === "rejected" && (
          <div className="mt-4 rounded-lg border border-red-600/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Verification failed. The URL did not return a valid HTTP 402 x402 challenge.
          </div>
        )}

        {(api.status === "pending" || api.status === "verifying") && (
          <div className="mt-4 rounded-lg border border-solana-purple/40 bg-solana-purple/10 px-4 py-3 text-sm text-solana-purple">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-solana-purple animate-pulse" />
              Verification in progress. Refresh shortly.
            </span>
          </div>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">
            <GradientText>Payment History</GradientText>
          </h2>
          <PaymentTable payments={payments} />
        </section>

        <div className="mt-10 flex gap-8 text-xs text-solana-muted border-t border-solana-border/40 pt-6">
          <div>
            <p>Registered</p>
            <p className="mt-0.5 text-neutral-400">
              {new Date(api.createdAt).toLocaleDateString("ja-JP")}
            </p>
          </div>
          <div>
            <p>ID</p>
            <p className="mt-0.5 font-mono text-neutral-400">{api.id}</p>
          </div>
        </div>
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm text-solana-muted hover:text-neutral-200 transition-colors duration-200">
          ← Back
        </Link>
        <p className="mt-8 text-solana-muted">API not found or worker unavailable.</p>
      </div>
    );
  }
}
