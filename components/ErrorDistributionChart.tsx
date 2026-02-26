// components/ErrorDistributionChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DistributionData {
  bin: string;
  count: number;
}

interface ErrorDistributionChartProps {
  data: DistributionData[];
  title?: string;
}

export default function ErrorDistributionChart({ data, title = "Error Margin Distribution" }: ErrorDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg w-full h-[400px] flex items-center justify-center text-slate-500">
        No error data available for chart.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg w-full h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span className="text-purple-400">📊</span> {title}
        </h3>
        <p className="text-sm text-slate-400">Frequency of global forecast misses by degree (MAE)</p>
      </div>
      
      <div className="flex-grow w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="bin" 
              stroke="#64748b" 
              fontSize={12} 
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              cursor={{ fill: '#1e293b' }}
            />
            <Bar 
              dataKey="count" 
              name="Frequency"
              fill="#8b5cf6" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}