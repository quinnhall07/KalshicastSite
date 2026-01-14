// dashboard.tsx (the file with the line graph i'm pretty sure)
import { useState } from "react";
import {
  useLocations,
  useForecasts,
  useObservations,
  useAccuracyStats,
} from "@/hooks/use-weather";
import { AddDataDialog } from "@/components/AddDataDialog";
import { StatsCard } from "@/components/StatsCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { format, parseISO, subDays, addDays } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CloudSun, ThermometerSun } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  // Queries
  const { data: locations, isLoading: loadingLocations } = useLocations();

  // Set default location when loaded
  if (locations?.length && !selectedLocationId) {
    setSelectedLocationId(locations[0].id.toString());
  }

  const currentLocationId = selectedLocationId || undefined;

  const { data: forecasts } = useForecasts(
    currentLocationId ? { locationId: currentLocationId } : undefined,
  );
  const { data: observations } = useObservations(
    currentLocationId ? { locationId: currentLocationId } : undefined,
  );
  const { data: stats, isLoading: loadingStats } =
    useAccuracyStats(currentLocationId);

  // Prepare Chart Data
  const chartData = (() => {
    if (!forecasts || !observations) return [];

    const dateMap = new Map<string, any>();

    // Get date range (last 30 days + next 7 days)
    const today = new Date();
    const startDate = subDays(today, 30);
    const endDate = addDays(today, 7);

    // Populate observations
    observations.forEach((obs) => {
      if (!dateMap.has(obs.date)) dateMap.set(obs.date, { date: obs.date });
      const entry = dateMap.get(obs.date);
      entry.observed = obs.highTemp;
    });

    // Populate forecasts (group by source)
    forecasts.forEach((forecast) => {
      const date = forecast.targetDate;
      if (!dateMap.has(date)) dateMap.set(date, { date });
      const entry = dateMap.get(date);
      // Dynamic key for each source: e.g., "NOAA", "AccuWeather"
      entry[forecast.source] = forecast.highTemp;
    });

    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  })();

  // Extract unique sources for chart lines
  const sources = forecasts
    ? Array.from(new Set(forecasts.map((f) => f.source)))
    : [];

  // Colors for different sources
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F"];

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

          <div className="flex items-center gap-3">
            <AddDataDialog />
          </div>
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
                Comparing predicted highs against actual recorded temperatures.
              </p>
            </div>

            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white border border-white/20" />
                <span className="text-muted-foreground">Observed</span>
              </div>
              {sources.map((source, i) => (
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                  tickFormatter={(date) => format(parseISO(date), "MMM d")}
                  minTickGap={30}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                  domain={["auto", "auto"]}
                  unit="°F"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 20, 30, 0.95)",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
                    color: "#fff",
                  }}
                  itemStyle={{ fontSize: "13px", padding: "2px 0" }}
                  labelStyle={{
                    marginBottom: "8px",
                    color: "#aaa",
                    fontSize: "12px",
                  }}
                  labelFormatter={(date) =>
                    format(parseISO(date as string), "EEEE, MMMM do, yyyy")
                  }
                />

                {/* Observed Line (Thick, White) */}
                <Line
                  type="monotone"
                  dataKey="observed"
                  stroke="#fff"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#fff", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#fff" }}
                  connectNulls
                  name="Observed High"
                />

                {/* Forecast Lines (Colors) */}
                {sources.map((source, i) => (
                  <Line
                    key={source}
                    type="monotone"
                    dataKey={source}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    activeDot={{ r: 5 }}
                    connectNulls
                    name={`${source} Prediction`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </main>
    </div>
  );
}
