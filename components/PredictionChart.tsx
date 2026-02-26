// components/PredictionChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Define the shape of the data we will pass into the chart
interface ChartData {
  date: string;
  actual: number;
  predicted: number;
}

interface PredictionChartProps {
  data: ChartData[];
  title?: string;
  stationId?: string;
}

export default function PredictionChart({ data, title = "Model Accuracy", stationId = "KNYC" }: PredictionChartProps) {
  // If no data is passed yet, show a clean loading/empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg w-full h-[400px] flex items-center justify-center text-slate-500">
        No forecast data available for chart.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg w-full h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span className="text-blue-400">📈</span> {title}
        </h3>
        <p className="text-sm text-slate-400">14-Day Historical Tracking for {stationId}</p>
      </div>
      
      <div className="flex-grow w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
          >
            {/* Subtle horizontal grid lines */}
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={12} 
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            
            <YAxis 
              stroke="#64748b" 
              fontSize={12} 
              tickFormatter={(value) => `${value}°`}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 5', 'dataMax + 5']} // Keeps the lines vertically centered
            />
            
            {/* Dark mode tooltip */}
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            
            {/* The "Reality" Line (Solid Gray) */}
            <Line 
              type="monotone" 
              name="Actual Temp"
              dataKey="actual" 
              stroke="#94a3b8" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#94a3b8', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            
            {/* The "Prediction" Line (Dashed Blue) */}
            <Line 
              type="monotone" 
              name="Model Prediction"
              dataKey="predicted" 
              stroke="#3b82f6" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}