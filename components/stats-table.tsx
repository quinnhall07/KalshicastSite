import { CheckCircle2, AlertCircle } from "lucide-react"

interface DashboardStat {
  station_id: string
  source: string
  n: number
  bias: number
  mae: number
  rmse: number
  pct_within_1f: number
}

export function StatsTable({ stats }: { stats: DashboardStat[] }) {
  if (!stats || stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">
          No Stats Available
        </h3>
        <p className="text-muted-foreground text-sm">
          Performance data will appear here once models are running.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Station
              </th>
              <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Model
              </th>
              <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                Sample
              </th>
              <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                Bias
              </th>
              <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                MAE
              </th>
              <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                RMSE
              </th>
              <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                {"Within 1\u00B0F"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.map((stat, idx) => (
              <tr
                key={`${stat.station_id}-${stat.source}-${idx}`}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-5 py-4 font-semibold text-primary">
                  {stat.station_id}
                </td>
                <td className="px-5 py-4 font-mono text-foreground text-xs">
                  {stat.source}
                </td>
                <td className="px-5 py-4 text-right text-muted-foreground font-mono">
                  {stat.n}
                </td>
                <td
                  className={`px-5 py-4 text-right font-mono ${
                    stat.bias > 0
                      ? "text-destructive"
                      : stat.bias < 0
                        ? "text-primary"
                        : "text-foreground"
                  }`}
                >
                  {stat.bias > 0 ? "+" : ""}
                  {stat.bias.toFixed(2)}
                  {"\u00B0"}
                </td>
                <td
                  className={`px-5 py-4 text-right font-mono font-bold ${
                    stat.mae <= 1.5 ? "text-accent" : "text-foreground"
                  }`}
                >
                  {stat.mae.toFixed(2)}
                  {"\u00B0"}
                </td>
                <td className="px-5 py-4 text-right font-mono text-foreground">
                  {stat.rmse.toFixed(2)}
                  {"\u00B0"}
                </td>
                <td className="px-5 py-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono font-semibold ${
                      stat.pct_within_1f >= 0.5
                        ? "bg-accent/10 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stat.pct_within_1f >= 0.5 ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : null}
                    {(stat.pct_within_1f * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
