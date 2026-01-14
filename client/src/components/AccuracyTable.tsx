import React, { useMemo } from "react";

type Metric = {
  source: string;
  period: "2d" | "3d" | "7d" | "31d";
  mae: number; // combined
  maeHigh: number;
  maeLow: number;
};

function MaeTriplet({ m }: { m?: Metric }) {
  const fmt = (v?: number) =>
    v == null || Number.isNaN(v) ? "—" : v.toFixed(2);
  if (!m) return <span className="text-white/40">—</span>;

  return (
    <div className="text-xs leading-5">
      <div className="flex gap-2">
        <span className="w-4 font-semibold text-white/70">H</span>
        <span className="font-mono text-white/80">{fmt(m.maeHigh)}</span>
      </div>
      <div className="flex gap-2">
        <span className="w-4 font-semibold text-white/70">L</span>
        <span className="font-mono text-white/80">{fmt(m.maeLow)}</span>
      </div>
      <div className="flex gap-2">
        <span className="w-4 font-semibold text-white/70">B</span>
        <span className="font-mono text-white/80">{fmt(m.mae)}</span>
      </div>
    </div>
  );
}

export default function AccuracyTable({ metrics }: { metrics: Metric[] }) {
  const periods: Metric["period"][] = ["2d", "3d", "7d", "31d"];

  const sources = useMemo(
    () => Array.from(new Set(metrics.map((m) => m.source))).sort(),
    [metrics],
  );

  const bySource = useMemo(() => {
    const m = new Map<string, Record<string, Metric>>();
    for (const row of metrics) {
      if (!m.has(row.source)) m.set(row.source, {});
      m.get(row.source)![row.period] = row;
    }
    return m;
  }, [metrics]);

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 text-sm font-semibold text-white/80">
        Accuracy (MAE) — last 2 / 3 / 7 / 31 days
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-white/60">
            <tr className="border-b border-white/10">
              <th className="py-2 text-left font-medium">Model</th>
              {periods.map((p) => (
                <th key={p} className="py-2 text-left font-medium">
                  {p}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sources.map((s) => {
              const row = bySource.get(s) || {};
              return (
                <tr key={s} className="border-b border-white/5 align-top">
                  <td className="py-2 text-white/85 pr-4">{s}</td>
                  {periods.map((p) => (
                    <td key={p} className="py-2">
                      <MaeTriplet m={row[p]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-white/50">
        H = High MAE, L = Low MAE, B = Both/Combined MAE
      </div>
    </div>
  );
}
