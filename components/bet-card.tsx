import { TrendingUp, Thermometer, MapPin, Calendar } from "lucide-react"

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

function getEdgeColor(edgeRatio: number) {
  if (edgeRatio >= 2) return "text-accent"
  if (edgeRatio >= 1.5) return "text-primary"
  return "text-muted-foreground"
}

function getEdgeLabel(edgeRatio: number) {
  if (edgeRatio >= 2) return "Strong Edge"
  if (edgeRatio >= 1.5) return "Good Edge"
  return "Moderate"
}

function getEdgeBorderColor(edgeRatio: number) {
  if (edgeRatio >= 2) return "border-accent/30"
  if (edgeRatio >= 1.5) return "border-primary/30"
  return "border-border"
}

export function BetCard({ bet }: { bet: BestBet }) {
  const pYesPercent = (bet.p_yes * 100).toFixed(1)

  return (
    <div
      className={`group relative flex flex-col gap-4 rounded-xl border ${getEdgeBorderColor(bet.edge_ratio)} bg-card p-5 transition-all hover:border-primary/40 hover:bg-card/80`}
    >
      {/* Edge badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            bet.edge_ratio >= 2
              ? "bg-accent/10 text-accent"
              : bet.edge_ratio >= 1.5
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          {getEdgeLabel(bet.edge_ratio)}
        </span>
      </div>

      {/* City & Type */}
      <div className="flex flex-col gap-1.5 pr-24">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {bet.station_id}
          </span>
        </div>
        <h3 className="text-lg font-bold text-foreground leading-tight">
          {bet.city_name || bet.station_id}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Thermometer className="w-3 h-3" />
            {bet.target_type.toUpperCase()}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(bet.target_date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Market Range */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
        <div className="flex-1 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Market Range</p>
          <p className="text-lg font-mono font-bold text-foreground">
            {bet.bin_even}{"° - "}{bet.bin_odd}{"°F"}
          </p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Margin</p>
          <p className="text-lg font-mono font-bold text-foreground">
            {bet.margin}{"°F"}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Model P(Yes)</p>
          <p className={`text-2xl font-mono font-bold ${getEdgeColor(bet.edge_ratio)}`}>
            {pYesPercent}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Edge Ratio</p>
          <p className={`text-2xl font-mono font-bold ${getEdgeColor(bet.edge_ratio)}`}>
            {bet.edge_ratio}x
          </p>
        </div>
      </div>

      {/* Probability bar */}
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            bet.edge_ratio >= 2
              ? "bg-accent"
              : bet.edge_ratio >= 1.5
                ? "bg-primary"
                : "bg-muted-foreground"
          }`}
          style={{ width: `${Math.min(parseFloat(pYesPercent), 100)}%` }}
        />
      </div>
    </div>
  )
}
