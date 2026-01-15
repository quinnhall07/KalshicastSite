import { useQuery } from "@tanstack/react-query";

export function useChart(locationId?: string) {
  return useQuery({
    queryKey: ["/api/chart/forecast-vs-observation", locationId],
    queryFn: async () => {
      if (!locationId) return null;
      const url = new URL(
        "/api/chart/forecast-vs-observation",
        window.location.origin,
      );
      url.searchParams.set("locationId", locationId);
      url.searchParams.set("days", "30");
      url.searchParams.set("leadDays", "2");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch chart payload");
      return await res.json();
    },
    enabled: !!locationId,
  });
}
