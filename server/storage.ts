import { db } from "./db";
import {
  locations, forecasts, observations,
  type InsertLocation, type InsertForecast, type InsertObservation,
  type Location, type Forecast, type Observation
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;

  // Forecasts
  getForecasts(filters?: { locationId?: number, source?: string, startDate?: string, endDate?: string }): Promise<Forecast[]>;
  createForecast(forecast: InsertForecast): Promise<Forecast>;

  // Observations
  getObservations(filters?: { locationId?: number, startDate?: string, endDate?: string }): Promise<Observation[]>;
  createObservation(observation: InsertObservation): Promise<Observation>;

  // Analytics
  getAccuracyStats(locationId?: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [loc] = await db.select().from(locations).where(eq(locations.id, id));
    return loc;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLoc] = await db.insert(locations).values(location).returning();
    return newLoc;
  }

  async getForecasts(filters?: { locationId?: number, source?: string, startDate?: string, endDate?: string }): Promise<Forecast[]> {
    let conditions = [];
    if (filters?.locationId) conditions.push(eq(forecasts.locationId, filters.locationId));
    if (filters?.source) conditions.push(eq(forecasts.source, filters.source));
    if (filters?.startDate) conditions.push(gte(forecasts.targetDate, filters.startDate));
    if (filters?.endDate) conditions.push(lte(forecasts.targetDate, filters.endDate));

    return await db.select().from(forecasts)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(forecasts.targetDate));
  }

  async createForecast(forecast: InsertForecast): Promise<Forecast> {
    const [newForecast] = await db.insert(forecasts).values(forecast).returning();
    return newForecast;
  }

  async getObservations(filters?: { locationId?: number, startDate?: string, endDate?: string }): Promise<Observation[]> {
    let conditions = [];
    if (filters?.locationId) conditions.push(eq(observations.locationId, filters.locationId));
    if (filters?.startDate) conditions.push(gte(observations.date, filters.startDate));
    if (filters?.endDate) conditions.push(lte(observations.date, filters.endDate));

    return await db.select().from(observations)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(observations.date));
  }

  async createObservation(observation: InsertObservation): Promise<Observation> {
    const [newObs] = await db.insert(observations).values(observation).returning();
    return newObs;
  }

  async getAccuracyStats(locationId?: number): Promise<any> {
    // This is a simplified calculation. Ideally, this would be a complex SQL query.
    // We'll fetch data and compute in memory for simplicity in this MVP, 
    // but for production with large data, use raw SQL aggregation.
    
    // Fetch last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const obs = await this.getObservations({ locationId, startDate });
    const preds = await this.getForecasts({ locationId, startDate });

    // Map observations by date and location
    const obsMap = new Map<string, number>();
    obs.forEach(o => obsMap.set(`${o.locationId}-${o.date}`, o.highTemp));

    // Group predictions by source
    const sourceErrors: Record<string, number[]> = {};
    const periods = { '2d': 2, '3d': 3, '7d': 7, '30d': 30 };
    
    const results: any[] = [];

    // Simple MAE calculation per source
    const sources = [...new Set(preds.map(p => p.source))];

    for (const source of sources) {
      const sourcePreds = preds.filter(p => p.source === source);
      
      for (const [periodLabel, days] of Object.entries(periods)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        const relevantPreds = sourcePreds.filter(p => p.targetDate >= cutoffStr);
        let totalError = 0;
        let count = 0;

        for (const pred of relevantPreds) {
          const key = `${pred.locationId}-${pred.targetDate}`;
          if (obsMap.has(key)) {
            totalError += Math.abs(pred.highTemp - obsMap.get(key)!);
            count++;
          }
        }

        if (count > 0) {
          results.push({
            source,
            period: periodLabel,
            mae: Number((totalError / count).toFixed(2))
          });
        }
      }
    }

    return results;
  }
}

export const storage = new DatabaseStorage();
