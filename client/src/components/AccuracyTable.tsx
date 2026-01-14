import React, { useMemo } from "react";

type Metric = {
  source: string;
  period: "2d" | "3d" | "7d" | "31d";
  mae: number;
  maeHigh: number;
  maeLow: number;
};

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
                <tr key={s} className="border-b border-white/5">
                  <td className="py-2 text-white/85">{s}</td>
                  {periods.map((p) => (
                    <td key={p} className="py-2 text-white/75">
                      {row[p] ? row[p].mae.toFixed(2) : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-white/50">
        (This table uses the combined MAE; you can also show High/Low MAE if you
        want.)
      </div>
    </div>
  );
}
