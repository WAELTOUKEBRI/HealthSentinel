"use client";

import { useState, useEffect } from "react"; // 🔹 Added for Hydration Fix
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { time: "10:00", rate: 72 },
  { time: "10:05", rate: 75 },
  { time: "10:10", rate: 78 },
  { time: "10:15", rate: 90 },
  { time: "10:20", rate: 110 },
  { time: "10:25", rate: 95 },
];

export default function HeartRateChart() {
  const [mounted, setMounted] = useState(false);

  // 🔹 Prevent Recharts -1/-1 warning by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[250px] w-full bg-card/20 animate-pulse rounded-2xl" />; 
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/10 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">
            Heart Rate Trends (BPM)
          </h2>
          <p className="text-2xl font-black tracking-tighter text-foreground">
            Monitor <span className="text-primary">Live</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
           <div className="relative flex h-2 w-2">
            <span className="animate-pulse-medical absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </div>
           <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">Active Stream</span>
        </div>
      </div>

      {/* 🔹 Fixed syntax typo and added min-w-0 */}
      <div className="h-[250px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="0" 
              vertical={true}
              horizontal={true}
              stroke="var(--border)"
              opacity={0.15}
            />

            <XAxis
              dataKey="time"
              axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600 }}
              dy={10}
            />

            <YAxis
              domain={[60, 160]}
              ticks={[60, 80, 100, 120, 140, 160]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600 }}
              tickMargin={12} 
            />

            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
              cursor={{ stroke: 'var(--primary)', strokeWidth: 1.5, strokeDasharray: '3 3' }}
            />

            <Line
              type="monotone"
              dataKey="rate"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--card)" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
