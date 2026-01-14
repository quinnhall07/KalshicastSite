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

      // ✅ Readable legend: right side, vertical, scrollable
      legend: {
        type: "scroll",
        orient: "vertical",
        right: 10,
        top: 10,
        bottom: 10,
        itemWidth: 14,
        itemHeight: 10,
        itemGap: 12,
        textStyle: {
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 18,
          color: "rgba(255,255,255,0.80)",
        },
        pageIconSize: 12,
        pageTextStyle: {
          fontSize: 12,
          color: "rgba(255,255,255,0.65)",
        },
        tooltip: { show: true },
        formatter: (name: string) =>
          name.replace(/^Observed /, "Obs ").replace(/\s+/g, " "),
      },

      // ✅ Reserve space for legend (right) and slider (bottom)
      grid: {
        left: 50,
        right: 260, // <- space for the legend column
        top: 40,
        bottom: 95, // <- space for slider + x-axis labels
      },

      xAxis: {
        type: "category",
        data: data.dates,
        axisLabel: {
          formatter: (v: string) => v.slice(5), // MM-DD
          color: "rgba(255,255,255,0.65)",
        },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
        axisTick: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
      },

      yAxis: {
        type: "value",
        axisLabel: { color: "rgba(255,255,255,0.65)" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.12)" } },
      },

      // ✅ Put slider at the bottom explicitly
      dataZoom: [
        { type: "inside", xAxisIndex: 0, filterMode: "none" },
        {
          type: "slider",
          xAxisIndex: 0,
          bottom: 20,
          height: 28,
          filterMode: "none",
          // optional: make handles easier to grab
          handleSize: "120%",
        },
      ],

      series,
    };
  }, [data]);

  return (
    <ReactECharts option={option} style={{ height: 420, width: "100%" }} />
  );
}
