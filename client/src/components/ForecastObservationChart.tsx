import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";

type Payload = {
  dates: string[];
  sources: string[];
  observed: { high: (number | null)[]; low: (number | null)[] };
  models: Record<string, { high: (number | null)[]; low: (number | null)[] }>;
};

export default function ForecastObservationChart({ data }: { data: Payload }) {
  const option = useMemo(() => {
    const series: any[] = [
      {
        name: "Observed High",
        type: "line",
        data: data.observed.high,
        connectNulls: false,
        showSymbol: false,
        lineStyle: { width: 3 },
      },
      {
        name: "Observed Low",
        type: "line",
        data: data.observed.low,
        connectNulls: false,
        showSymbol: false,
        lineStyle: { width: 3 },
      },
    ];

    for (const source of data.sources) {
      series.push(
        {
          name: `${source} High`,
          type: "line",
          data: data.models[source]?.high ?? [],
          connectNulls: false,
          showSymbol: false,
        },
        {
          name: `${source} Low`,
          type: "line",
          data: data.models[source]?.low ?? [],
          connectNulls: false,
          showSymbol: false,
        },
      );
    }

    return {
      tooltip: { trigger: "axis" },
      legend: { type: "scroll" },
      grid: { left: 50, right: 20, top: 40, bottom: 60 },
      xAxis: {
        type: "category",
        data: data.dates,
        axisLabel: { formatter: (v: string) => v.slice(5) }, // MM-DD
      },
      yAxis: { type: "value" },
      dataZoom: [{ type: "inside" }, { type: "slider" }],
      series,
    };
  }, [data]);

  return (
    <ReactECharts option={option} style={{ height: 420, width: "100%" }} />
  );
}
