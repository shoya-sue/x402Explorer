import Link from "next/link";
import SubmitForm from "../../components/SubmitForm.js";

export const metadata = {
  title: "Register API · x402 Explorer",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Register an x402 API</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Submit a URL that responds with HTTP 402. We&apos;ll automatically verify the x402
        challenge and list your API in the explorer.
      </p>
      <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <SubmitForm />
      </div>
    </div>
  );
}
