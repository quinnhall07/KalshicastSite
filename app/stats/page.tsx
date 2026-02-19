// app/stats/page.tsx
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

export const revalidate = 0;

export default async function StatsDashboard() {
  // Fetch 1-day lead stats for overall performance ('both' high and low)
  const { data: stats, error } = await supabase
    .from('dashboard_stats')
    .select('*')
    .eq('kind', 'both')
    .eq('lead_days', 1)
    .order('mae', { ascending: true });

  if (error) {
    console.error('Error fetching stats:', error);
    return <div className="p-8 text-red-500">Error loading dashboard stats.</div>;
  }

  return (
    <main className="min-h-screen p-8 bg-slate-950 text-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold">Model Performance Matrix</h1>
            <p className="text-slate-400 mt-1">1-Day Lead Time • Highs & Lows Combined</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
            ← Back to Live Bets
          </Link>
        </div>

        {/* The Data Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4 font-semibold">Station</th>
                  <th className="p-4 font-semibold">Model Source</th>
                  <th className="p-4 font-semibold text-right">Sample (n)</th>
                  <th className="p-4 font-semibold text-right">Bias</th>
                  <th className="p-4 font-semibold text-right">MAE</th>
                  <th className="p-4 font-semibold text-right">RMSE</th>
                  <th className="p-4 font-semibold text-right">Within 1°F</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats?.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-medium text-blue-400">{stat.station_id}</td>
                    <td className="p-4 font-mono">{stat.source}</td>
                    <td className="p-4 text-right text-slate-400">{stat.n}</td>
                    
                    {/* Bias: Color coded red for hot, blue for cold */}
                    <td className={`p-4 text-right font-mono ${
                      stat.bias > 0 ? 'text-red-400' : stat.bias < 0 ? 'text-blue-400' : 'text-slate-300'
                    }`}>
                      {stat.bias > 0 ? '+' : ''}{stat.bias.toFixed(2)}°
                    </td>
                    
                    {/* MAE: Highlight the tightest errors in green */}
                    <td className={`p-4 text-right font-mono font-bold ${stat.mae <= 1.5 ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {stat.mae.toFixed(2)}°
                    </td>
                    
                    <td className="p-4 text-right font-mono text-slate-300">
                      {stat.rmse.toFixed(2)}°
                    </td>
                    
                    {/* Accuracy Percentage */}
                    <td className="p-4 text-right font-mono">
                      <span className={`px-2 py-1 rounded bg-slate-950 border ${
                        stat.pct_within_1f >= 0.5 ? 'border-emerald-900 text-emerald-400' : 'border-slate-800 text-slate-400'
                      }`}>
                        {(stat.pct_within_1f * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}