import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTradeHistory } from "../lib/useTradeHistory";
import "./PriceChart.css";

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatPrice(p) {
  if (p === 0) return "$0";
  if (p < 0.000001) return `$${p.toExponential(2)}`;
  return `$${p.toFixed(6)}`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="price-chart__tooltip">
      <span className="price-chart__tooltip-price">{formatPrice(point.price)}</span>
      <span className="price-chart__tooltip-time">{formatTime(point.timestamp)}</span>
    </div>
  );
}

export default function PriceChart({ curveAddress }) {
  const { trades, loading, error } = useTradeHistory(curveAddress);

  const data = useMemo(
    () => trades.map((t, i) => ({ i, price: t.price, timestamp: t.timestamp })),
    [trades]
  );

  if (loading) {
    return <div className="price-chart price-chart--empty">Loading chart…</div>;
  }

  if (error) {
    return <div className="price-chart price-chart--empty">Couldn't load price history.</div>;
  }

  if (data.length < 2) {
    return (
      <div className="price-chart price-chart--empty">
        Not enough trades yet for a chart — needs at least 2.
      </div>
    );
  }

  return (
    <div className="price-chart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00E5D0" />
              <stop offset="50%" stopColor="#FF3EA5" />
              <stop offset="100%" stopColor="#FFD166" />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)" }} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="url(#priceLineGradient)"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
