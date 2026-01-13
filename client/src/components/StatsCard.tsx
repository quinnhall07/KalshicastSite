import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Activity } from "lucide-react";
import type { DashboardStats, AccuracyMetric } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  loading: boolean;
  stats?: {
    metrics: AccuracyMetric[];
    summary: {
      bestSource: string;
      bestSourceMae: number;
    };
  };
}

export function StatsCard({ loading, stats }: StatsCardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-card/50 animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Best Performing Model */}
      <Card className="glass-card p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Award className="w-24 h-24 text-primary rotate-12" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Top Performer</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-display font-bold text-primary">{stats.summary.bestSource || "N/A"}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
              MAE: {stats.summary.bestSourceMae?.toFixed(1) || 0}°F
            </Badge>
            <span className="text-xs text-muted-foreground">Most accurate overall</span>
          </div>
        </div>
      </Card>

      {/* Accuracy Breakdown */}
      <Card className="glass-card p-6 col-span-1 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Model Accuracy (MAE)</p>
            <h3 className="text-xl font-display font-bold">Performance Matrix</h3>
          </div>
          <Activity className="text-muted-foreground w-5 h-5" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.metrics.slice(0, 4).map((metric, idx) => (
            <div key={`${metric.source}-${metric.period}`} className="flex flex-col p-3 rounded-lg bg-background/40 border border-white/5">
              <span className="text-xs text-muted-foreground mb-1">{metric.source} ({metric.period})</span>
              <div className="flex items-end justify-between">
                <span className={cn(
                  "text-xl font-mono font-bold",
                  metric.mae < 2 ? "text-green-400" : metric.mae < 4 ? "text-yellow-400" : "text-red-400"
                )}>
                  ±{metric.mae.toFixed(1)}°
                </span>
              </div>
              <div className="w-full bg-white/5 h-1.5 mt-2 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", metric.mae < 2 ? "bg-green-400" : metric.mae < 4 ? "bg-yellow-400" : "bg-red-400")}
                  style={{ width: `${Math.max(0, 100 - (metric.mae * 10))}%` }} 
                />
              </div>
            </div>
          ))}
          {stats.metrics.length === 0 && (
            <div className="col-span-4 text-center py-4 text-muted-foreground text-sm">
              No accuracy data available yet. Add observations to calculate metrics.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
