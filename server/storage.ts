import { supabaseAdmin } from "./supabase";

type LocationLike = {
  id: string; // station_id (text)
  name: string; // station name
  code: string; // station_id again (for your UI “KNYC” badge)
  lat?: string | null;
  long?: string | null;
};

type ForecastLike = {
  stationId: string;
  source: string;
  targetDate: string;
  highTemp: number | null;
  lowTemp: number | null;
};

type ObservationLike = {
  stationId: string;
  date: string;
  highTemp: number | null;
  lowTemp: number | null;
};

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const storage = {
  // ... existing methods ...
  async getForecasts(filters: {
    locationId?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ForecastLike[]> {
    let q = supabaseAdmin
      .from("forecasts")
      .select("station_id,source_id,target_date,high,low,sources(name)")
      .order("target_date", { ascending: true });

    if (filters.locationId) q = q.eq("station_id", filters.locationId);
    if (filters.startDate) q = q.gte("target_date", filters.startDate);
    if (filters.endDate) q = q.lte("target_date", filters.endDate);

    if (filters.source) {
      q = q.eq("source_id", filters.source);
    }

    const { data, error } = await q;
    if (error) throw error;

    let rows = (data ?? []).map((f: any) => ({
      stationId: f.station_id,
      source: f.sources?.name ?? f.source_id,
      targetDate: f.target_date,
      highTemp: f.high ?? null,
      lowTemp: f.low ?? null,
    }));

    if (filters.source) {
      rows = rows.filter(
        (r) => r.source === filters.source
      );
    }

    return rows;
  },

  async getObservations(filters: {
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ObservationLike[]> {
    let q = supabaseAdmin
      .from("observations")
      .select("station_id,date,observed_high,observed_low")
      .order("date", { ascending: true });

    if (filters.locationId) q = q.eq("station_id", filters.locationId);
    if (filters.startDate) q = q.gte("date", filters.startDate);
    if (filters.endDate) q = q.lte("date", filters.endDate);

    const { data, error } = await q;
    if (error) throw error;

    return (data ?? []).map((o) => ({
      stationId: o.station_id,
      date: o.date,
      highTemp: o.observed_high ?? null,
      lowTemp: o.observed_low ?? null,
    }));
  },

  async getAccuracyStats(stationId?: string) {
    const today = new Date();
    const windows = [
      { period: "2d", days: 2 },
      { period: "3d", days: 3 },
      { period: "7d", days: 7 },
      { period: "31d", days: 31 },
    ] as const;

    const results: any[] = [];

    for (const w of windows) {
      const start = new Date(today);
      start.setDate(start.getDate() - w.days);

      let q = supabaseAdmin
        .from("scores")
        .select("source_id,high_error,low_error,sources(name),target_date,station_id")
        .gte("target_date", iso(start))
        .lte("target_date", iso(today));

      if (stationId) q = q.eq("station_id", stationId);

      const { data, error } = await q;
      if (error) throw error;

      const bySource = new Map<
        string,
        { name: string; sumHigh: number; sumLow: number; n: number }
      >();

      for (const row of data ?? []) {
        const name = (row as any).sources?.name ?? row.source_id;
        const key = row.source_id;

        const hErr = (row as any).high_error;
        const lErr = (row as any).low_error;
        if (hErr === null && lErr === null) continue;

        const cur = bySource.get(key) ?? { name, sumHigh: 0, sumLow: 0, n: 0 };
        if (hErr !== null) cur.sumHigh += Math.abs(Number(hErr));
        if (lErr !== null) cur.sumLow += Math.abs(Number(lErr));
        cur.n += 1;
        bySource.set(key, cur);
      }

      for (const [sourceId, agg] of bySource.entries()) {
        results.push({
          source: agg.name,
          sourceId,
          period: w.period,
          maeHigh: agg.n ? agg.sumHigh / agg.n : 0,
          maeLow: agg.n ? agg.sumLow / agg.n : 0,
          mae: agg.n ? (agg.sumHigh + agg.sumLow) / (2 * agg.n) : 0,
        });
      }
    }

    return results;
  },
};
};
