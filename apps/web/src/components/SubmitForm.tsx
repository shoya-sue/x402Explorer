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
      <div className="rounded-xl border border-green-800 bg-green-950/40 p-6">
        <p className="font-semibold text-green-400">Submitted successfully!</p>
        <p className="mt-1 text-sm text-neutral-400">
          Your API is being verified in the background. It will appear in the explorer once
          approved.
        </p>
        <Link
          href={`/apis/${state.id}`}
          className="mt-4 inline-block text-sm text-blue-400 underline hover:text-blue-300"
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
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Must return HTTP 402 with a valid x402 challenge body.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">
          Display name{" "}
          <span className="text-neutral-500">(optional — defaults to hostname)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My AI API"
          maxLength={120}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {state.status === "error" && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={state.status === "loading"}
        className="self-start rounded-lg bg-neutral-100 px-6 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-white disabled:opacity-50"
      >
        {state.status === "loading" ? "Submitting…" : "Submit API"}
      </button>
    </form>
  );
}
