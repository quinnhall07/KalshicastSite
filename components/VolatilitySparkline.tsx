// components/VolatilitySparkline.tsx
"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineData {
  temp: number;
}

interface VolatilitySparklineProps {
  data: SparklineData[];
  color?: string;
}

export default function VolatilitySparkline({ data, color = "#94a3b8" }: VolatilitySparklineProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-12 w-24 opacity-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {/* We hide the Y-Axis but use it to scale the line so it doesn't get clipped */}
          <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
          <Line 
            type="monotone" 
            dataKey="temp" 
            stroke={color} 
            strokeWidth={2.5} 
            dot={false} 
            isAnimationActive={false} // Disabled animation so they snap in instantly on load
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}