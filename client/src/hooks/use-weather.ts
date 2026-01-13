import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { 
  InsertLocation, 
  InsertForecast, 
  InsertObservation,
  Location,
  Forecast,
  Observation
} from "@shared/schema";

// --- Locations ---

export function useLocations() {
  return useQuery({
    queryKey: [api.locations.list.path],
    queryFn: async () => {
      const res = await fetch(api.locations.list.path);
      if (!res.ok) throw new Error("Failed to fetch locations");
      return api.locations.list.responses[200].parse(await res.json());
    },
  });
}

export function useLocation(id: number) {
  return useQuery({
    queryKey: [api.locations.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.locations.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch location");
      return api.locations.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertLocation) => {
      const validated = api.locations.create.input.parse(data);
      const res = await fetch(api.locations.create.path, {
        method: api.locations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create location");
      return api.locations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.locations.list.path] });
    },
  });
}

// --- Forecasts ---

export function useForecasts(filters?: { locationId?: number; source?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: [api.forecasts.list.path, filters],
    queryFn: async () => {
      const url = new URL(api.forecasts.list.path, window.location.origin);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, String(value));
        });
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch forecasts");
      return api.forecasts.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateForecast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertForecast) => {
      const validated = api.forecasts.create.input.parse(data);
      const res = await fetch(api.forecasts.create.path, {
        method: api.forecasts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create forecast");
      return api.forecasts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.forecasts.list.path] });
    },
  });
}

// --- Observations ---

export function useObservations(filters?: { locationId?: number; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: [api.observations.list.path, filters],
    queryFn: async () => {
      const url = new URL(api.observations.list.path, window.location.origin);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, String(value));
        });
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch observations");
      return api.observations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertObservation) => {
      const validated = api.observations.create.input.parse(data);
      const res = await fetch(api.observations.create.path, {
        method: api.observations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create observation");
      return api.observations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.observations.list.path] });
    },
  });
}

// --- Stats ---

export function useAccuracyStats(locationId?: number) {
  return useQuery({
    queryKey: [api.stats.accuracy.path, locationId],
    queryFn: async () => {
      const url = new URL(api.stats.accuracy.path, window.location.origin);
      if (locationId) url.searchParams.append("locationId", String(locationId));
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch accuracy stats");
      return api.stats.accuracy.responses[200].parse(await res.json());
    },
    enabled: !!locationId, // Only fetch if a location is selected
  });
}
