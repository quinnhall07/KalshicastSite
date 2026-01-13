import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Locations
  app.get(api.locations.list.path, async (req, res) => {
    const locations = await storage.getLocations();
    res.json(locations);
  });

  app.post(api.locations.create.path, async (req, res) => {
    try {
      const input = api.locations.create.input.parse(req.body);
      const location = await storage.createLocation(input);
      res.status(201).json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.locations.get.path, async (req, res) => {
    const location = await storage.getLocation(Number(req.params.id));
    if (!location) return res.status(404).json({ message: "Location not found" });
    res.json(location);
  });

  // Forecasts
  app.get(api.forecasts.list.path, async (req, res) => {
    const filters = {
      locationId: req.query.locationId ? Number(req.query.locationId) : undefined,
      source: req.query.source as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const forecasts = await storage.getForecasts(filters);
    res.json(forecasts);
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
      locationId: req.query.locationId ? Number(req.query.locationId) : undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const observations = await storage.getObservations(filters);
    res.json(observations);
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

  // Stats
  app.get(api.stats.accuracy.path, async (req, res) => {
    const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;
    const metrics = await storage.getAccuracyStats(locationId);
    
    // Find best source for 7d or 30d
    const bestSourceMetric = metrics
      .filter((m: any) => m.period === '7d')
      .sort((a: any, b: any) => a.mae - b.mae)[0];

    res.json({
      metrics,
      summary: {
        bestSource: bestSourceMetric?.source || "N/A",
        bestSourceMae: bestSourceMetric?.mae || 0,
      }
    });
  });

  // Seed Data (if empty)
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const locations = await storage.getLocations();
  if (locations.length === 0) {
    const nyc = await storage.createLocation({ name: "New York, NY", code: "KNYC", lat: "40.7128", long: "-74.0060" });
    const la = await storage.createLocation({ name: "Los Angeles, CA", code: "KLAX", lat: "34.0522", long: "-118.2437" });
    
    // Seed Observations (Last 7 days)
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      await storage.createObservation({
        locationId: nyc.id,
        date: dateStr,
        highTemp: 70 + Math.floor(Math.random() * 10), // Random 70-80
      });
    }

    // Seed Forecasts (Last 7 days + next 2)
    const sources = ["GFS", "NAM", "ECMWF"];
    for (const source of sources) {
      for (let i = -7; i <= 2; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        await storage.createForecast({
          locationId: nyc.id,
          source,
          targetDate: dateStr,
          highTemp: 70 + Math.floor(Math.random() * 12) - (source === "GFS" ? 0 : 2), // Slight variance by source
        });
      }
    }
  }
}
