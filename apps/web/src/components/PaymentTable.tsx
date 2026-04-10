import type { Payment } from "@x402/shared";

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleString("ja-JP", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function solscanUrl(signature: string) {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}

interface PaymentTableProps {
  payments: Payment[];
}

export default function PaymentTable({ payments }: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-solana-muted">
        No payments recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-solana-border/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-solana-border/50 bg-solana-surface/30 text-left text-xs text-solana-muted">
            <th className="px-4 py-3 font-medium">Signature</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">From</th>
            <th className="px-4 py-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p, i) => (
            <tr
              key={p.signature}
              className={`border-b border-solana-border/30 transition-colors hover:bg-solana-surface/50 ${
                i % 2 === 0 ? "bg-transparent" : "bg-solana-surface/20"
              }`}
            >
              <td className="px-4 py-3">
                <a
                  href={solscanUrl(p.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-solana-purple hover:text-solana-green transition-colors duration-200"
                >
                  {p.signature.slice(0, 12)}…
                </a>
              </td>
              <td className="px-4 py-3 font-semibold text-solana-green">
                {p.amount} {p.token}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-solana-muted">
                {p.fromAddress.slice(0, 8)}…{p.fromAddress.slice(-4)}
              </td>
              <td className="px-4 py-3 text-xs text-solana-muted">{formatDate(p.blockTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
