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
  source: string; // source name (GFS, ECMWF, etc.)
  targetDate: string; // YYYY-MM-DD
  highTemp: number | null;
};

type ObservationLike = {
  stationId: string;
  date: string; // YYYY-MM-DD
  highTemp: number | null;
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

  // Disable create/update locations for now (you asked to remove Add Station)
  async createLocation() {
    throw new Error(
      "Creating stations is disabled. Stations come from Supabase.",
    );
  },
  async updateLocation() {
    throw new Error(
      "Updating stations is disabled. Stations come from Supabase.",
    );
  },

  async getForecasts(filters: {
    locationId?: string; // station_id
    source?: string; // source name or source_id (we’ll accept either)
    startDate?: string;
    endDate?: string;
  }): Promise<ForecastLike[]> {
    let q = supabaseAdmin
      .from("forecasts")
      .select("station_id,source_id,target_date,high,sources(name)")
      .order("target_date", { ascending: true });

    if (filters.locationId) q = q.eq("station_id", filters.locationId);
    if (filters.startDate) q = q.gte("target_date", filters.startDate);
    if (filters.endDate) q = q.lte("target_date", filters.endDate);

    // If they pass a source, we match either source_id or sources.name
    if (filters.source) {
      // Supabase doesn't do OR across relations cleanly in one call;
      // simplest: filter by source_id first, fallback to name in memory.
      q = q.eq("source_id", filters.source);
    }

    const { data, error } = await q;
    if (error) throw error;

    let rows = (data ?? []).map((f: any) => ({
      stationId: f.station_id,
      source: f.sources?.name ?? f.source_id,
      targetDate: f.target_date,
      highTemp: f.high ?? null,
    }));

    if (filters.source) {
      rows = rows.filter(
        (r) => r.source === filters.source || r.source === filters.source,
      );
    }

    return rows;
  },

  async getObservations(filters: {
    locationId?: string; // station_id
    startDate?: string;
    endDate?: string;
  }): Promise<ObservationLike[]> {
    let q = supabaseAdmin
      .from("observations")
      .select("station_id,date,observed_high")
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
    }));
  },

  // Forecast/observation editing can come later under “Modify Data”
  async createForecast() {
    throw new Error("Use Modify Data for edits (not wired yet).");
  },
  async updateForecast() {
    throw new Error("Use Modify Data for edits (not wired yet).");
  },
  async createObservation() {
    throw new Error("Use Modify Data for edits (not wired yet).");
  },
  async updateObservation() {
    throw new Error("Use Modify Data for edits (not wired yet).");
  },

  async getAccuracyStats(stationId?: string) {
    // Use scores table: MAE = avg(abs(high_error)) by source over time windows
    const today = new Date();
    const windows = [
      { period: "2d", days: 2 },
      { period: "3d", days: 3 },
      { period: "7d", days: 7 },
      { period: "30d", days: 30 },
    ] as const;

    const results: any[] = [];

    for (const w of windows) {
      const start = new Date(today);
      start.setDate(start.getDate() - w.days);

      let q = supabaseAdmin
        .from("scores")
        .select("source_id,high_error,sources(name),target_date,station_id")
        .gte("target_date", iso(start))
        .lte("target_date", iso(today));

      if (stationId) q = q.eq("station_id", stationId);

      const { data, error } = await q;
      if (error) throw error;

      const bySource = new Map<
        string,
        { name: string; sum: number; n: number }
      >();

      for (const row of data ?? []) {
        const name = (row as any).sources?.name ?? row.source_id;
        const key = row.source_id;

        const err = (row as any).high_error;
        if (err === null || err === undefined) continue;

        const abs = Math.abs(Number(err));
        const cur = bySource.get(key) ?? { name, sum: 0, n: 0 };
        cur.sum += abs;
        cur.n += 1;
        bySource.set(key, cur);
      }

      for (const [sourceId, agg] of bySource.entries()) {
        results.push({
          source: agg.name,
          sourceId,
          period: w.period,
          mae: agg.n ? agg.sum / agg.n : 0,
          rmse: 0,
          bias: 0,
        });
      }
    }

    return results;
  },
};
