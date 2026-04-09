import Link from "next/link";
import { getApi, getApiStat, getPayments } from "../../../lib/api.js";
import StatusBadge from "../../../components/StatusBadge.js";
import PaymentTable from "../../../components/PaymentTable.js";

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
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Back to explorer
        </Link>

        <div className="mt-6 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{api.name}</h1>
          <StatusBadge status={api.status} />
        </div>

        <a
          href={api.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block truncate text-sm text-blue-400 hover:underline"
        >
          {api.url}
        </a>

        {api.status === "approved" && (
          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-neutral-500">Price</dt>
              <dd className="mt-0.5 font-medium">
                {api.priceAmount} {api.priceToken}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Network</dt>
              <dd className="mt-0.5 font-medium">{api.network}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Wallet</dt>
              <dd className="mt-0.5 font-mono text-xs text-neutral-300">
                {api.wallet.slice(0, 8)}…{api.wallet.slice(-6)}
              </dd>
            </div>
          </dl>
        )}

        {stats && (
          <dl className="mt-4 grid grid-cols-3 gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
            <div>
              <dt className="text-xs text-neutral-500">Total Volume</dt>
              <dd className="mt-0.5 font-medium">
                {stats.totalVolume} {stats.token ?? api.priceToken}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Payments</dt>
              <dd className="mt-0.5 font-medium">{stats.paymentCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Last Payment</dt>
              <dd className="mt-0.5 text-sm text-neutral-300">
                {stats.lastPaymentAt
                  ? new Date(stats.lastPaymentAt).toLocaleDateString("ja-JP")
                  : "—"}
              </dd>
            </div>
          </dl>
        )}

        {api.status === "rejected" && (
          <div className="mt-4 rounded-lg border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            Verification failed. The URL did not return a valid HTTP 402 x402 challenge.
          </div>
        )}

        {(api.status === "pending" || api.status === "verifying") && (
          <div className="mt-4 rounded-lg border border-yellow-800 bg-yellow-950/30 px-4 py-3 text-sm text-yellow-400">
            Verification in progress. Refresh shortly.
          </div>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Payment History</h2>
          <PaymentTable payments={payments} />
        </section>

        <dl className="mt-10 flex gap-8 text-xs text-neutral-500">
          <div>
            <dt>Registered</dt>
            <dd className="mt-0.5 text-neutral-400">
              {new Date(api.createdAt).toLocaleDateString("ja-JP")}
            </dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd className="mt-0.5 font-mono text-neutral-400">{api.id}</dd>
          </div>
        </dl>
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Back
        </Link>
        <p className="mt-8 text-neutral-400">API not found or worker unavailable.</p>
      </div>
    );
  }
}
