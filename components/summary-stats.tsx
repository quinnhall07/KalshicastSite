import { Activity, Target, TrendingUp, Zap } from "lucide-react"

interface BestBet {
  station_id: string
  city_name: string
  target_type: string
  target_date: string
  bin_even: number
  bin_odd: number
  p_yes: number
  margin: number
  edge_ratio: number
}

export function SummaryStats({ bets }: { bets: BestBet[] }) {
  const totalBets = bets.length
  const avgEdge =
    totalBets > 0
      ? bets.reduce((sum, b) => sum + b.edge_ratio, 0) / totalBets
      : 0
  const strongEdgeBets = bets.filter((b) => b.edge_ratio >= 2).length
  const avgPYes =
    totalBets > 0
      ? bets.reduce((sum, b) => sum + b.p_yes, 0) / totalBets
      : 0

  const stats = [
    {
      label: "Active Markets",
      value: totalBets.toString(),
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Avg Edge Ratio",
      value: `${avgEdge.toFixed(2)}x`,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Strong Edge Bets",
      value: strongEdgeBets.toString(),
      icon: Zap,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
    {
      label: "Avg Model P(Yes)",
      value: `${(avgPYes * 100).toFixed(1)}%`,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
        >
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.bgColor}`}
          >
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-xl font-mono font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
