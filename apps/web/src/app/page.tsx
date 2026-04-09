import type { Network } from "@x402/shared";

export default function Home() {
  const network: Network = "devnet";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 px-6 py-24">
      <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs uppercase tracking-wider text-neutral-400">
        Week 1-2 foundation
      </span>
      <h1 className="text-5xl font-bold tracking-tight">x402 Explorer</h1>
      <p className="text-lg text-neutral-300">
        Discover, register, and visualize APIs that implement the x402 payment protocol on Solana.
      </p>
      <p className="text-sm text-neutral-500">
        Current network:{" "}
        <code className="rounded bg-neutral-800 px-1.5 py-0.5">{network}</code>
      </p>
    </main>
  );
}
