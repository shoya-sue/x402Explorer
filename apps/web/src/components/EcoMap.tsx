"use client";

import type { ApiListing, ApiStats } from "@x402/shared";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface EcoMapProps {
  apis: ApiListing[];
  stats: Record<string, ApiStats>;
}

interface ScatterPoint {
  x: number;
  y: number;
  z: number;
  name: string;
  totalVolume: string;
  paymentCount: number;
  priceToken: string;
  network: "devnet" | "mainnet-beta";
  category: string;
}

interface TooltipPayloadItem {
  payload: ScatterPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  DeFi: "#4ade80",
  NFT: "#a78bfa",
  Gaming: "#f59e0b",
  Data: "#38bdf8",
  AI: "#fb7185",
  Other: "#94a3b8",
};

function getCategoryColor(category: string | undefined): string {
  if (!category) return CATEGORY_COLORS["Other"] ?? "#94a3b8";
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS["Other"] ?? "#94a3b8";
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 shadow-lg">
      <p className="font-semibold text-neutral-100">{point.name}</p>
      <p className="mt-1 text-xs text-neutral-400">
        Volume: {point.totalVolume} {point.priceToken}
      </p>
      <p className="text-xs text-neutral-400">
        Payments: {point.paymentCount}
      </p>
      {point.category && (
        <p className="text-xs text-neutral-500">{point.category}</p>
      )}
      <p className="text-xs text-neutral-600">{point.network}</p>
    </div>
  );
}

export default function EcoMap({ apis, stats }: EcoMapProps) {
  const points: ScatterPoint[] = [];
  for (const api of apis) {
    const stat = stats[api.id];
    if (!stat) continue;
    const volume = Number(stat.totalVolume);
    points.push({
      x: volume,
      y: stat.paymentCount,
      z: Math.max(200, Math.min(2000, volume * 50 + 300)),
      name: api.name,
      totalVolume: stat.totalVolume,
      paymentCount: stat.paymentCount,
      priceToken: api.priceToken,
      network: api.network,
      category: api.category ?? "Other",
    });
  }

  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/50">
        <p className="text-neutral-400">No payment history yet for approved APIs.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="mb-4 text-xs text-neutral-500">
        Bubble size and X-axis represent total payment volume (USDC).
        Y-axis shows payment count.
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="x"
            name="Total Volume"
            tick={{ fill: "#737373", fontSize: 11 }}
            label={{
              value: "Total Volume (USDC)",
              position: "insideBottom",
              offset: -10,
              fill: "#525252",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Payment Count"
            tick={{ fill: "#737373", fontSize: 11 }}
            label={{
              value: "Payment Count",
              angle: -90,
              position: "insideLeft",
              fill: "#525252",
              fontSize: 11,
            }}
          />
          <ZAxis type="number" dataKey="z" range={[60, 600]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#525252" }} />
          <Scatter data={points} isAnimationActive={false}>
            {points.map((point, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getCategoryColor(point.category)}
                fillOpacity={0.75}
                stroke={getCategoryColor(point.category)}
                strokeOpacity={0.5}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-neutral-400">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
