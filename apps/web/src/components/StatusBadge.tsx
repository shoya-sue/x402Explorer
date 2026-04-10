import type { ApiStatus } from "@x402/shared";

const colors: Record<ApiStatus, string> = {
  pending: "border-yellow-600/50 bg-yellow-500/10 text-yellow-400",
  verifying: "border-solana-purple/50 bg-solana-purple/10 text-solana-purple",
  approved: "border-solana-green/50 bg-solana-green/10 text-solana-green",
  rejected: "border-red-600/50 bg-red-500/10 text-red-400",
  disabled: "border-solana-border bg-solana-surface text-solana-muted",
};

const dotColors: Record<ApiStatus, string> = {
  pending: "bg-yellow-400",
  verifying: "bg-solana-purple animate-pulse",
  approved: "bg-solana-green animate-pulse",
  rejected: "bg-red-400",
  disabled: "bg-solana-muted",
};

interface StatusBadgeProps {
  status: ApiStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[status]}`} />
      {status}
    </span>
  );
}
