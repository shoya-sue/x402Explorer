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
  DeFi: "#14F195",
  NFT: "#9945FF",
  Gaming: "#f59e0b",
  Data: "#00D18C",
  AI: "#fb7185",
  Other: "#7C71A0",
};

function getCategoryColor(category: string | undefined): string {
  if (!category) return CATEGORY_COLORS["Other"] ?? "#7C71A0";
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS["Other"] ?? "#7C71A0";
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-solana-border/50 bg-solana-surface/90 backdrop-blur-sm px-4 py-3 shadow-glow-card">
      <p className="font-semibold text-neutral-100">{point.name}</p>
      <div className="mt-2 space-y-0.5">
        <p className="text-xs text-solana-green">
          Volume: <span className="font-semibold">{point.totalVolume} {point.priceToken}</span>
        </p>
        <p className="text-xs text-solana-muted">
          Payments: <span className="text-neutral-300">{point.paymentCount}</span>
        </p>
        {point.category && (
          <p className="text-xs text-solana-muted">{point.category}</p>
        )}
        <p className="text-xs text-solana-border">{point.network}</p>
      </div>
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
      <div className="flex h-64 items-center justify-center rounded-xl border border-solana-border/50 bg-solana-surface/30">
        <p className="text-solana-muted">No payment history yet for approved APIs.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-solana-border/50 bg-solana-surface/30 backdrop-blur-sm p-6">
      <p className="mb-6 text-xs text-solana-muted">
        Bubble size and X-axis represent total payment volume (USDC). Y-axis shows payment count.
      </p>
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
          <defs>
            <filter id="glow-bubble" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <XAxis
            type="number"
            dataKey="x"
            name="Total Volume"
            tick={{ fill: "#7C71A0", fontSize: 11 }}
            axisLine={{ stroke: "#2D2640" }}
            tickLine={{ stroke: "#2D2640" }}
            label={{
              value: "Total Volume (USDC)",
              position: "insideBottom",
              offset: -15,
              fill: "#7C71A0",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Payment Count"
            tick={{ fill: "#7C71A0", fontSize: 11 }}
            axisLine={{ stroke: "#2D2640" }}
            tickLine={{ stroke: "#2D2640" }}
            label={{
              value: "Payment Count",
              angle: -90,
              position: "insideLeft",
              fill: "#7C71A0",
              fontSize: 11,
            }}
          />
          <ZAxis type="number" dataKey="z" range={[60, 600]} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: "3 3", stroke: "#2D2640" }}
          />
          <Scatter data={points} isAnimationActive={false} filter="url(#glow-bubble)">
            {points.map((point, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getCategoryColor(point.category)}
                fillOpacity={0.8}
                stroke={getCategoryColor(point.category)}
                strokeOpacity={0.4}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
            />
            <span className="text-xs text-solana-muted">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
