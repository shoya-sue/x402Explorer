"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Network } from "@x402/shared";

const NETWORKS: { value: Network; label: string }[] = [
  { value: "devnet", label: "Devnet" },
  { value: "mainnet-beta", label: "Mainnet" },
];

interface NetworkToggleProps {
  defaultNetwork?: Network;
}

export default function NetworkToggle({ defaultNetwork = "devnet" }: NetworkToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentNetwork = (searchParams.get("network") as Network | null) ?? defaultNetwork;

  function handleSelect(network: Network) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("network", network);
    router.push(`?${params.toString()}`);
  }

  return (
    <div
      role="group"
      aria-label="Select network"
      className="flex overflow-hidden rounded-lg border border-solana-border"
    >
      {NETWORKS.map(({ value, label }) => {
        const isActive = currentNetwork === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            aria-pressed={isActive}
            className={[
              "px-4 py-1.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-brand text-white shadow-glow-purple/20"
                : "bg-transparent text-solana-muted hover:bg-solana-surface hover:text-neutral-200",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
