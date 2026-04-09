import type { Payment } from "@x402/shared";

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleString("ja-JP", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface PaymentTableProps {
  payments: Payment[];
}

export default function PaymentTable({ payments }: PaymentTableProps) {
  if (payments.length === 0) {
    return <p className="text-sm text-neutral-500">No payments recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-left text-xs text-neutral-500">
            <th className="pb-2 pr-4 font-medium">Signature</th>
            <th className="pb-2 pr-4 font-medium">Amount</th>
            <th className="pb-2 pr-4 font-medium">From</th>
            <th className="pb-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/50">
          {payments.map((p) => (
            <tr key={p.signature}>
              <td className="py-2.5 pr-4 font-mono text-xs text-neutral-400">
                {p.signature.slice(0, 12)}…
              </td>
              <td className="py-2.5 pr-4 text-neutral-300">
                {p.amount} {p.token}
              </td>
              <td className="py-2.5 pr-4 font-mono text-xs text-neutral-400">
                {p.fromAddress.slice(0, 8)}…
              </td>
              <td className="py-2.5 text-xs text-neutral-500">{formatDate(p.blockTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
