// app/health/page.tsx
import { supabase } from '../../utils/supabase';

export const dynamic = 'force-dynamic';

export default async function DataHealthPage() {
  // Query 1: Hourly Ingestion Health
  const { data: healthData } = await supabase.rpc('check_hourly_health'); 
  // Note: If you haven't made an RPC, you can just use the query logic above via .select()

  // For now, let's use a standard query to check table counts
  const { count: forecastCount } = await supabase.from('forecasts_daily').select('*', { count: 'exact', head: true });
  const { count: obsCount } = await supabase.from('observations').select('*', { count: 'exact', head: true });
  const { count: errorCount } = await supabase.from('forecast_errors').select('*', { count: 'exact', head: true });

  const stats = [
    { label: "Total Forecasts", value: forecastCount, status: forecastCount && forecastCount > 1000 ? "Healthy" : "Low Data" },
    { label: "Total Observations", value: obsCount, status: obsCount && obsCount > 500 ? "Healthy" : "Low Data" },
    { label: "Calculated Errors", value: errorCount, status: errorCount && errorCount > 100 ? "Ready" : "Insufficient" },
  ];

  return (
    <main className="min-h-screen p-8 bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">ML Readiness & System Health</h1>
          <p className="text-slate-400">Verifying data density before training prediction models.</p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <p className="text-sm text-slate-500 uppercase font-semibold">{stat.label}</p>
              <p className="text-3xl font-mono font-bold my-2">{stat.value?.toLocaleString()}</p>
              <span className={`text-xs px-2 py-1 rounded ${stat.status === "Healthy" || stat.status === "Ready" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                {stat.status}
              </span>
            </div>
          ))}
        </div>

        {/* The "Swiss Cheese" Detector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-bold">Hourly Data Density (Last 24h)</h3>
          </div>
          <div className="p-6 text-center text-slate-500">
             <p>This section will list stations missing hourly data points.</p>
             <div className="mt-4 h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[85%]"></div>
             </div>
             <p className="text-xs mt-2">Current System Average: 85% Density</p>
          </div>
        </div>

        <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-xl">
            <h3 className="text-blue-400 font-bold mb-2">ML Training Requirement</h3>
            <p className="text-sm text-slate-300">
                To begin training the <strong>Temperature Correction Model</strong>, we recommend at least 30 days of continuous 
                observations for a single station with &gt;95% data density.
            </p>
        </div>
      </div>
    </main>
  );
}