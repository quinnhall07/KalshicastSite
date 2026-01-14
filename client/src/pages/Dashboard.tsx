// dashboard.tsx (the file with the line graph i'm pretty sure)
import { useState } from "react";
import {
  useLocations,
  useForecasts,
  useObservations,
  useAccuracyStats,
} from "@/hooks/use-weather";
import { StatsCard } from "@/components/StatsCard";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChart } from "@/hooks/use-chart";
import ForecastObservationChart from "@/components/ForecastObservationChart";
import AccuracyTable from "@/components/AccuracyTable";
import { Loader2, CloudSun, ThermometerSun } from "lucide-react";

export default function Dashboard() {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  // Queries
  const { data: locations, isLoading: loadingLocations } = useLocations();

  // Set default location when loaded
  if (locations?.length && !selectedLocationId) {
    setSelectedLocationId(locations[0].id.toString());
  }

  const currentLocationId = selectedLocationId || undefined;

  const { data: stats, isLoading: loadingStats } =
    useAccuracyStats(currentLocationId);

  const { data: chartPayload, isLoading: loadingChart } = useChart(currentLocationId);

  const sources = chartPayload?.sources || [];
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="min-h-screen pb-20">
      {/* Header / Nav */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <CloudSun className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">
                WeatherBet
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Predictive Model Accuracy Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
            >
              <SelectTrigger className="w-[280px] h-12 glass-input font-medium text-lg">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    <span className="font-mono text-muted-foreground mr-2">
                      {loc.code}
                    </span>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm text-muted-foreground">Accuracy Metric</p>
            <p className="font-mono font-bold text-primary">
              Mean Absolute Error (MAE)
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <StatsCard loading={loadingStats} stats={stats} />

        {/* Main Chart Area */}
        <Card className="glass-card p-6 border-white/10 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <ThermometerSun className="w-5 h-5 text-secondary" />
                Forecast vs. Observation
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Predicted highs/lows vs observed highs/lows for the last 30 days (gaps preserved).
              </p>
            </div>

            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white border border-white/20" />
                <span className="text-muted-foreground">Observed</span>
              </div>
              {sources.map((source: string, i: number) => (
                <div key={source} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  />
                  <span className="text-muted-foreground">{source}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full min-h-[400px]">
            {loadingChart ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : chartPayload ? (
              <ForecastObservationChart data={chartPayload} />
            ) : (
              <div className="text-muted-foreground">No chart data.</div>
            )}
          </div>

          {stats?.metrics?.length ? <AccuracyTable metrics={stats.metrics} /> : null}
        </Card>
      </main>
    </div>
  );
}
