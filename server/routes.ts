// routes.ts
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/_debug/supabase", async (_req, res) => {
    try {
      const { supabaseAdmin } = await import("./supabase");

      const stations = await supabaseAdmin
        .from("stations")
        .select("station_id,name")
        .limit(5);

      const sources = await supabaseAdmin
        .from("sources")
        .select("source_id,name")
        .limit(5);

      const forecasts = await supabaseAdmin
        .from("forecasts")
        .select("station_id,source_id,target_date,high")
        .limit(5);

      const observations = await supabaseAdmin
        .from("observations")
        .select("station_id,date,observed_high")
        .limit(5);

      res.json({
        ok: true,
        stations: stations.data,
        stationsError: stations.error?.message ?? null,
        sources: sources.data,
        sourcesError: sources.error?.message ?? null,
        forecasts: forecasts.data,
        forecastsError: forecasts.error?.message ?? null,
        observations: observations.data,
        observationsError: observations.error?.message ?? null,
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message ?? String(e) });
    }
  });

  // Locations (Stations)
  app.get(api.locations.list.path, async (_req, res) => {
    const locations = await storage.getLocations();
    res.json(locations);
  });

  app.get(api.locations.get.path, async (req, res) => {
    const location = await storage.getLocation(String(req.params.id));
    if (!location)
      return res.status(404).json({ message: "Location not found" });
    res.json(location);
  });

  // Disable station modifications
  app.patch(api.locations.update.path, async (_req, res) => {
    res
      .status(400)
      .json({ message: "Stations are managed in Supabase. Editing disabled." });
  });

  // Forecasts
  app.get(api.forecasts.list.path, async (req, res) => {
    const filters = {
      locationId: req.query.locationId
        ? String(req.query.locationId)
        : undefined,
      source: req.query.source as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const forecasts = await storage.getForecasts(filters);
    res.json(forecasts);
  });

  app.patch(api.forecasts.update.path, async (req, res) => {
    try {
      const input = api.forecasts.update.input.parse(req.body);
      const forecast = await storage.updateForecast(
        Number(req.params.id),
        input,
      );
      res.json(forecast);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Forecast not found" });
    }
  });

  app.post(api.forecasts.create.path, async (req, res) => {
    try {
      const input = api.forecasts.create.input.parse(req.body);
      const forecast = await storage.createForecast(input);
      res.status(201).json(forecast);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Observations
  app.get(api.observations.list.path, async (req, res) => {
    const filters = {
      locationId: req.query.locationId
        ? String(req.query.locationId)
        : undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const observations = await storage.getObservations(filters);
    res.json(observations);
  });

  app.patch(api.observations.update.path, async (req, res) => {
    try {
      const input = api.observations.update.input.parse(req.body);
      const observation = await storage.updateObservation(
        Number(req.params.id),
        input,
      );
      res.json(observation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Observation not found" });
    }
  });

  app.post(api.observations.create.path, async (req, res) => {
    try {
      const input = api.observations.create.input.parse(req.body);
      const observation = await storage.createObservation(input);
      res.status(201).json(observation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get("/api/chart/forecast-vs-observation", async (req, res) => {
    try {
      const locationId = req.query.locationId
        ? String(req.query.locationId)
        : "";
      if (!locationId)
        return res.status(400).json({ message: "locationId is required" });

      const days = req.query.days ? Number(req.query.days) : 30;
      const leadDays = req.query.leadDays ? Number(req.query.leadDays) : 2;

      const payload = await storage.getChartForecastVsObservation({
        locationId,
        days,
        leadDays,
      });

      res.json(payload);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({
        message: "Failed to build chart payload",
        error: e?.message ?? String(e),
      });
    }
  });

  // Stats
  app.get(api.stats.accuracy.path, async (req, res) => {
    const locationId = req.query.locationId
      ? String(req.query.locationId)
      : undefined;

    const metrics = await storage.getAccuracyStats(locationId);

    // Find best source for 7d
    const bestSourceMetric = metrics
      .filter((m: any) => m.period === "7d")
      .sort((a: any, b: any) => (a.mae ?? 0) - (b.mae ?? 0))[0];

    res.json({
      metrics,
      summary: {
        bestSource: bestSourceMetric?.source || "N/A",
        bestSourceMae: bestSourceMetric?.mae || 0,
      },
    });
  });

  return httpServer;
}
