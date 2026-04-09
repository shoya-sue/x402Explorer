import type { ApiStatus } from "@x402/shared";

const colors: Record<ApiStatus, string> = {
  pending: "bg-yellow-900/50 text-yellow-400 border-yellow-800",
  verifying: "bg-blue-900/50 text-blue-400 border-blue-800",
  approved: "bg-green-900/50 text-green-400 border-green-800",
  rejected: "bg-red-900/50 text-red-400 border-red-800",
  disabled: "bg-neutral-800 text-neutral-500 border-neutral-700",
};

interface StatusBadgeProps {
  status: ApiStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}
    >
      {status}
    </span>
  );
}
