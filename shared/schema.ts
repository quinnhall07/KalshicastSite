// schema.ts
import { pgTable, text, serial, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Locations (Stations)
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // e.g. 'KNYC', 'LGA'
  lat: text("lat"),
  long: text("long"),
});

// Weather Forecasts (Predictions)
export const forecasts = pgTable("forecasts", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  source: text("source").notNull(), // e.g. 'NOAA', 'AccuWeather'
  targetDate: text("target_date").notNull(), // YYYY-MM-DD
  highTemp: integer("high_temp").notNull(),
  predictedAt: timestamp("predicted_at").defaultNow().notNull(),
});

// Weather Observations (Actuals)
export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  highTemp: integer("high_temp").notNull(),
});

// Relations
export const locationsRelations = relations(locations, ({ many }) => ({
  forecasts: many(forecasts),
  observations: many(observations),
}));

export const forecastsRelations = relations(forecasts, ({ one }) => ({
  location: one(locations, {
    fields: [forecasts.locationId],
    references: [locations.id],
  }),
}));

export const observationsRelations = relations(observations, ({ one }) => ({
  location: one(locations, {
    fields: [observations.locationId],
    references: [locations.id],
  }),
}));

// Schemas
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export const insertForecastSchema = createInsertSchema(forecasts).omit({ id: true });
export const insertObservationSchema = createInsertSchema(observations).omit({ id: true });

// Types
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = z.infer<typeof insertForecastSchema>;
export type Observation = typeof observations.$inferSelect;
export type InsertObservation = z.infer<typeof insertObservationSchema>;

// Derived Types for API
export interface AccuracyMetric {
  source: string;
  period: '2d' | '3d' | '7d' | '30d';
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  bias: number; // Average difference
}

export interface DashboardStats {
  bestSource: string;
  bestSourceMae: number;
  worstSource: string;
  worstSourceMae: number;
  totalForecasts: number;
  totalObservations: number;
}
