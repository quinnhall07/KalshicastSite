// storage.ts
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
  // “Locations” in your app == stations in Supabase
  async getLocations(): Promise<LocationLike[]> {
    const { data, error } = await supabaseAdmin
      .from("stations")
      .select("station_id,name,lat,lon")
      .order("name", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((s) => ({
      id: s.station_id,
      name: s.name,
      code: s.station_id,
      lat: s.lat?.toString() ?? null,
      long: s.lon?.toString() ?? null,
    }));
  },

  async getLocation(id: string): Promise<LocationLike | null> {
    const { data, error } = await supabaseAdmin
      .from("stations")
      .select("station_id,name,lat,lon")
      .eq("station_id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.station_id,
      name: data.name,
      code: data.station_id,
      lat: data.lat?.toString() ?? null,
      long: data.lon?.toString() ?? null,
    };
  },

  // Disable create/update locations for now
  async createLocation() {
    throw new Error("Creating stations is disabled. Stations come from Supabase.");
  },
  async updateLocation() {
    throw new Error("Updating stations is disabled. Stations come from Supabase.");
  },

  async getForecasts(filters: {
    locationId?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<
    Array<
      ForecastLike & {
        forecastDate?: string | null;
        fetchedAt?: string | null;
      }
    >
  > {
    let q = supabaseAdmin
      .from("forecasts")
      .select("station_id,source_id,forecast_date,target_date,high,low,fetched_at,sources(name)")
      .order("target_date", { ascending: true });

    if (filters.locationId) q = q.eq("station_id", filters.locationId);
    if (filters.startDate) q = q.gte("target_date", filters.startDate);
    if (filters.endDate) q = q.lte("target_date", filters.endDate);

    if (filters.source) q = q.eq("source_id", filters.source);

    const { data, error } = await q;
    if (error) throw error;

    let rows = (data ?? []).map((f: any) => ({
      stationId: f.station_id,
      source: f.sources?.name ?? f.source_id,
      targetDate: f.target_date,
      highTemp: f.high ?? null,
      lowTemp: f.low ?? null,
      forecastDate: f.forecast_date ?? null,
      fetchedAt: f.fetched_at ?? null,
    }));

    return rows;
  },

  async getChartForecastVsObservation(params: {
    locationId: string;
    days?: number;
    leadDays?: number;
  }) {
    const days = params.days ?? 30;
    const leadDays = params.leadDays ?? 2;

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));

    const startDate = iso(start);
    const endDate = iso(end);

    const observations = await this.getObservations({
      locationId: params.locationId,
      startDate,
      endDate,
    });

    const forecastStart = new Date(start);
    forecastStart.setDate(forecastStart.getDate() - leadDays);

    const forecasts = await this.getForecasts({
      locationId: params.locationId,
      startDate: iso(forecastStart),
      endDate,
    });

    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(iso(d));
    }

    const obsByDate = new Map<string, { high: number | null; low: number | null }>();
    for (const o of observations) {
      obsByDate.set(o.date, { high: o.highTemp ?? null, low: o.lowTemp ?? null });
    }

    const parseISODate = (s: string) => new Date(`${s}T00:00:00Z`);
    const diffDays = (aISO: string, bISO: string) => {
      const a = parseISODate(aISO).getTime();
      const b = parseISODate(bISO).getTime();
      return Math.round((a - b) / (1000 * 60 * 60 * 24));
    };

    const bySourceTarget = new Map<string, any>();
    for (const f of forecasts as any[]) {
      if (!f.forecastDate) continue;
      if (diffDays(f.targetDate, f.forecastDate) !== leadDays) continue;

      const key = `${f.source}__${f.targetDate}`;
      const prev = bySourceTarget.get(key);

      if (!prev) {
        bySourceTarget.set(key, f);
        continue;
      }

      const prevT = prev.fetchedAt ? new Date(prev.fetchedAt).getTime() : 0;
      const curT = f.fetchedAt ? new Date(f.fetchedAt).getTime() : 0;
      if (curT >= prevT) bySourceTarget.set(key, f);
    }

    const sources = Array.from(new Set((forecasts as any[]).map((f) => f.source))).sort();

    const observedHigh = dates.map((d) => obsByDate.get(d)?.high ?? null);
    const observedLow  = dates.map((d) => obsByDate.get(d)?.low ?? null);

    const models: Record<string, { high: (number | null)[]; low: (number | null)[] }> = {};
    for (const source of sources) {
      models[source] = {
        high: dates.map((d) => bySourceTarget.get(`${source}__${d}`)?.highTemp ?? null),
        low:  dates.map((d) => bySourceTarget.get(`${source}__${d}`)?.lowTemp ?? null),
      };
    }

    return {
      locationId: params.locationId,
      startDate,
      endDate,
      days,
      leadDays,
      dates,
      sources,
      observed: { high: observedHigh, low: observedLow },
      models,
    };
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

      for (const [sourceId, agg] of Array.from(bySource.entries())) {
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
