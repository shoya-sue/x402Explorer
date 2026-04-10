export const runtime = "edge";

import Link from "next/link";
import SubmitForm from "../../components/SubmitForm.js";
import GlowCard from "../../components/GlowCard.js";
import GradientText from "../../components/GradientText.js";

export const metadata = {
  title: "Register API · x402 Explorer",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="text-sm text-solana-muted hover:text-neutral-200 transition-colors duration-200"
      >
        ← Back
      </Link>

      <div className="mt-8">
        <h1 className="text-3xl font-extrabold">
          Register an{" "}
          <GradientText>x402 API</GradientText>
        </h1>
        <p className="mt-3 text-sm text-solana-muted leading-relaxed">
          Submit a URL that responds with HTTP 402. We&apos;ll automatically verify the x402
          challenge and list your API in the explorer once approved.
        </p>
      </div>

      <div className="mt-8">
        <GlowCard hover={false}>
          <SubmitForm />
        </GlowCard>
      </div>

      <div className="mt-6 rounded-lg border border-solana-border/40 bg-solana-surface/30 px-4 py-3 text-xs text-solana-muted">
        <span className="font-medium text-solana-purple">How it works:</span>{" "}
        Your endpoint must return{" "}
        <code className="font-mono text-solana-green">HTTP 402</code> with a valid x402 challenge
        body including a wallet address, price, and token. Verification runs automatically in the background.
      </div>
    </div>
  );
}
