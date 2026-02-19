// app/page.tsx
import { supabase } from '../utils/supabase';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // --- 1. DATA FETCHING (Wired to your actual schema) ---
  
  // Fetch latest daily observations for the Volatility Matrix
  const { data: rawObs, error: obsError } = await supabase
    .from('observations')
    .select(`
      date,
      observed_high,
      observed_low,
      station_id,
      locations ( city, state )
    `)
    .order('date', { ascending: false })
    .limit(50);

  // Fetch the largest recent forecast errors for the Truth Tracker
  const { data: rawErrors, error: errError } = await supabase
    .from('forecast_errors')
    .select(`
      target_date,
      err_high,
      err_low,
      mae,
      station_id,
      locations ( city ),
      forecast_runs ( source )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  // --- 2. DATA PROCESSING ---

  // Process Observations: Group by station to find Day-over-Day swings
  const obsByStation = new Map();
  rawObs?.forEach(obs => {
    if (!obsByStation.has(obs.station_id)) {
      obsByStation.set(obs.station_id, []);
    }
    obsByStation.get(obs.station_id).push(obs);
  });

  const volatilityData = Array.from(obsByStation.values())
    .filter(obsList => obsList.length >= 2) // We need at least 2 days to calculate a swing
    .map(obsList => {
      // Assuming sorted by date descending
      const latest = obsList[0];
      const previous = obsList[1];
      const deltaHigh = latest.observed_high - previous.observed_high;
      
      return {
        station_id: latest.station_id,
        city: latest.locations?.city || latest.station_id,
        temp_now: latest.observed_high,
        temp_prev: previous.observed_high,
        delta: deltaHigh,
        date: latest.date
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)) // Sort by most extreme swing
    .slice(0, 6);

  // Process Errors: Filter out nulls and sort by worst Mean Absolute Error (MAE)
  const bustsData = (rawErrors || [])
    .filter(err => err.mae !== null)
    .sort((a, b) => b.mae - a.mae)
    .slice(0, 8)
    .map(err => ({
      station_id: err.station_id,
      city: err.locations?.city || err.station_id,
      source: err.forecast_runs?.source || 'Unknown',
      target_date: err.target_date,
      err_high: err.err_high,
      err_low: err.err_low,
      mae: err.mae
    }));

  // --- 3. RENDER UI ---
  return (
    <main className="min-h-screen p-8 bg-slate-950 text-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* --- SECTION 1: DAILY VOLATILITY MATRIX --- */}
        <section>
          <div className="mb-6 border-b border-slate-800 pb-2 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <span className="text-blue-400">🌊</span> High Temp Volatility
              </h2>
              <p className="text-slate-400 text-sm mt-1">Day-over-day changes in maximum temperatures</p>
            </div>
          </div>

          {volatilityData.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400">
              Not enough daily observation data to calculate swings yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {volatilityData.map((cond, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-200">{cond.city}</h3>
                      <p className="text-xs font-mono text-slate-500">{cond.date}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold font-mono rounded-md border ${
                      Math.abs(cond.delta) >= 10 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      Math.abs(cond.delta) >= 5 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {cond.delta > 0 ? '+' : ''}{cond.delta.toFixed(1)}°
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Latest High</p>
                      <p className="text-3xl font-mono font-bold">{cond.temp_now}°</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Previous High</p>
                      <p className="text-xl font-mono text-slate-500">{cond.temp_prev}°</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* --- SECTION 2: THE TRUTH TRACKER --- */}
        <section>
          <div className="mb-6 border-b border-slate-800 pb-2">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span className="text-red-400">⚠️</span> The Truth Tracker: Worst Model Busts
            </h2>
            <p className="text-slate-400 text-sm mt-1">Recent forecasts with the highest Mean Absolute Error (MAE)</p>
          </div>

          {bustsData.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400">
              No forecast errors logged yet. Check your ingestion pipeline.
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4 font-semibold">Target Date</th>
                      <th className="p-4 font-semibold">City</th>
                      <th className="p-4 font-semibold">Model Source</th>
                      <th className="p-4 font-semibold text-right">High Error</th>
                      <th className="p-4 font-semibold text-right">Low Error</th>
                      <th className="p-4 font-semibold text-right">Overall Miss (MAE)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bustsData.map((bust, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono text-slate-400">{bust.target_date}</td>
                        <td className="p-4 font-medium text-blue-400">
                          {bust.city} <span className="text-slate-500 text-xs ml-1">{bust.station_id}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-300">{bust.source}</td>
                        <td className="p-4 text-right font-mono text-slate-400">
                          {bust.err_high !== null ? `${bust.err_high > 0 ? '+' : ''}${bust.err_high}°` : '-'}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-400">
                          {bust.err_low !== null ? `${bust.err_low > 0 ? '+' : ''}${bust.err_low}°` : '-'}
                        </td>
                        <td className="p-4 text-right font-mono">
                          <span className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
                            {bust.mae.toFixed(1)}°
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}