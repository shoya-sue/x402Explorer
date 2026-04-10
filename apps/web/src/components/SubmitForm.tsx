"use client";

import { useState } from "react";
import Link from "next/link";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? "http://localhost:8787";

type SubmitStatus = "idle" | "loading" | "success" | "error";

interface SubmitState {
  status: SubmitStatus;
  id?: string;
  error?: string;
}

export default function SubmitForm() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "loading" });

    try {
      const body: Record<string, string> = { url };
      if (name.trim()) body["name"] = name.trim();

      const res = await fetch(`${WORKER_URL}/apis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { id: string };
        error?: unknown;
      };

      if (!res.ok || !json.success) {
        setState({ status: "error", error: JSON.stringify(json.error) });
        return;
      }

      setState(
        json.data?.id !== undefined
          ? { status: "success", id: json.data.id }
          : { status: "success" },
      );
    } catch (err) {
      setState({ status: "error", error: String(err) });
    }
  }

  if (state.status === "success" && state.id) {
    return (
      <div className="rounded-xl border border-solana-green/30 bg-solana-green/10 p-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-solana-green animate-pulse" />
          <p className="font-semibold text-solana-green">Submitted successfully!</p>
        </div>
        <p className="mt-2 text-sm text-solana-muted">
          Your API is being verified in the background. It will appear in the explorer once approved.
        </p>
        <Link
          href={`/apis/${state.id}`}
          className="mt-4 inline-block text-sm text-solana-green hover:underline"
        >
          Check verification status →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">
          API URL <span className="text-red-400">*</span>
        </label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/resource"
          className="input-field text-sm"
        />
        <p className="mt-1 text-xs text-solana-muted">
          Must return HTTP 402 with a valid x402 challenge body.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">
          Display name{" "}
          <span className="text-solana-muted">(optional — defaults to hostname)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My AI API"
          maxLength={120}
          className="input-field text-sm"
        />
      </div>

      {state.status === "error" && (
        <p className="rounded-lg border border-red-600/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={state.status === "loading"}
        className="self-start glow-btn disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state.status === "loading" ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Submitting…
          </span>
        ) : (
          "Submit API"
        )}
      </button>
    </form>
  );
}
