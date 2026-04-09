import type { ApiListing, ApiStats, Payment } from "@x402/shared";

const BASE = process.env.NEXT_PUBLIC_WORKER_URL ?? "http://localhost:8787";

interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export async function getApis(params?: {
  status?: string;
  network?: string;
  page?: number;
  limit?: number;
}): Promise<ListResponse<ApiListing>> {
  const url = new URL(`${BASE}/apis`);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.network) url.searchParams.set("network", params.network);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch /apis failed: ${res.status}`);
  return res.json() as Promise<ListResponse<ApiListing>>;
}

export async function getApi(id: string): Promise<SingleResponse<ApiListing>> {
  const res = await fetch(`${BASE}/apis/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch /apis/${id} failed: ${res.status}`);
  return res.json() as Promise<SingleResponse<ApiListing>>;
}

export async function getApiStats(params?: {
  network?: string;
}): Promise<ApiStats[]> {
  const url = new URL(`${BASE}/apis/stats`);
  if (params?.network) url.searchParams.set("network", params.network);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch /apis/stats failed: ${res.status}`);
  const json = (await res.json()) as { success: boolean; data: ApiStats[] };
  return json.data;
}

export async function getApiStat(id: string): Promise<ApiStats | null> {
  const res = await fetch(`${BASE}/apis/${id}/stats`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { success: boolean; data: ApiStats | null };
  return json.data;
}

export async function getPayments(params?: {
  apiId?: string;
  page?: number;
  limit?: number;
}): Promise<ListResponse<Payment>> {
  const url = new URL(`${BASE}/payments`);
  if (params?.apiId) url.searchParams.set("apiId", params.apiId);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch /payments failed: ${res.status}`);
  return res.json() as Promise<ListResponse<Payment>>;
}
